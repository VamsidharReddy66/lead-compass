-- Create role enum
CREATE TYPE public.app_role AS ENUM ('super_admin', 'venture_admin', 'venture_agent', 'independent_agent');

-- Create account type enum
CREATE TYPE public.account_type AS ENUM ('independent_agent', 'venture');

-- Create ventures table
CREATE TABLE public.ventures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  account_type account_type NOT NULL DEFAULT 'independent_agent',
  venture_id UUID REFERENCES public.ventures(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  venture_id UUID REFERENCES public.ventures(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role, venture_id)
);

-- Create venture_agents table (for ventures to add agents)
CREATE TABLE public.venture_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id UUID REFERENCES public.ventures(id) ON DELETE CASCADE NOT NULL,
  agent_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  invited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  joined_at TIMESTAMPTZ,
  UNIQUE (venture_id, agent_id)
);

-- Enable RLS
ALTER TABLE public.ventures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venture_agents ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role, _venture_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
      AND (venture_id = _venture_id OR _venture_id IS NULL)
  )
$$;

-- Function to get user's primary role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;

-- Function to get user's venture_id (for venture admins)
CREATE OR REPLACE FUNCTION public.get_user_venture_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT venture_id FROM public.user_roles WHERE user_id = _user_id AND venture_id IS NOT NULL LIMIT 1
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Venture admins can view their agents profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.venture_agents va
      WHERE va.agent_id = profiles.id
        AND va.venture_id = public.get_user_venture_id(auth.uid())
    )
  );

-- RLS Policies for ventures
CREATE POLICY "Venture admins can view own venture" ON public.ventures
  FOR SELECT USING (id = public.get_user_venture_id(auth.uid()));

CREATE POLICY "Venture admins can update own venture" ON public.ventures
  FOR UPDATE USING (id = public.get_user_venture_id(auth.uid()));

-- RLS Policies for user_roles
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies for venture_agents
CREATE POLICY "Venture admins can manage their agents" ON public.venture_agents
  FOR ALL USING (venture_id = public.get_user_venture_id(auth.uid()));

CREATE POLICY "Agents can view their venture memberships" ON public.venture_agents
  FOR SELECT USING (auth.uid() = agent_id);

-- Trigger to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _account_type account_type;
  _venture_name TEXT;
  _venture_id UUID;
BEGIN
  _account_type := COALESCE((NEW.raw_user_meta_data ->> 'account_type')::account_type, 'independent_agent');
  _venture_name := NEW.raw_user_meta_data ->> 'venture_name';
  
  -- If venture account, create venture first
  IF _account_type = 'venture' AND _venture_name IS NOT NULL THEN
    INSERT INTO public.ventures (name, email) VALUES (_venture_name, NEW.email)
    RETURNING id INTO _venture_id;
  END IF;
  
  -- Create profile
  INSERT INTO public.profiles (id, email, full_name, account_type, venture_id)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'full_name',
    _account_type,
    _venture_id
  );
  
  -- Create role
  IF _account_type = 'venture' THEN
    INSERT INTO public.user_roles (user_id, role, venture_id)
    VALUES (NEW.id, 'venture_admin', _venture_id);
  ELSE
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'independent_agent');
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_ventures_updated_at BEFORE UPDATE ON public.ventures
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();