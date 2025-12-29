-- Update handle_new_user function to add input validation/truncation
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _account_type account_type;
  _venture_name TEXT;
  _full_name TEXT;
  _venture_id UUID;
BEGIN
  _account_type := COALESCE((NEW.raw_user_meta_data ->> 'account_type')::account_type, 'independent_agent');
  
  -- Validate and truncate inputs to prevent DoS and data integrity issues
  _venture_name := SUBSTRING(NEW.raw_user_meta_data ->> 'venture_name', 1, 255);
  _full_name := SUBSTRING(NEW.raw_user_meta_data ->> 'full_name', 1, 255);
  
  -- If venture account, create venture first
  IF _account_type = 'venture' AND _venture_name IS NOT NULL AND LENGTH(TRIM(_venture_name)) > 0 THEN
    INSERT INTO public.ventures (name, email) VALUES (TRIM(_venture_name), NEW.email)
    RETURNING id INTO _venture_id;
  END IF;
  
  -- Create profile with validated inputs
  INSERT INTO public.profiles (id, email, full_name, account_type, venture_id)
  VALUES (
    NEW.id,
    NEW.email,
    NULLIF(TRIM(_full_name), ''),
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
$function$;