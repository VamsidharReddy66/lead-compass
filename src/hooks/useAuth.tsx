import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type AppRole =
  | 'super_admin'
  | 'venture_admin'
  | 'venture_agent'
  | 'independent_agent';

type AccountType = 'independent_agent' | 'venture';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  account_type: AccountType | null;
  venture_id: string | null;
}

interface UserRole {
  role: AppRole;
  venture_id: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  userRole: UserRole | null;
  isVentureAdmin: boolean;
  isAgent: boolean;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    metadata: SignUpMetadata
  ) => Promise<{ error: Error | null }>;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

interface SignUpMetadata {
  full_name: string;
  account_type: AccountType;
  venture_name?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  const isVentureAdmin = userRole?.role === 'venture_admin';
  const isAgent = userRole?.role === 'venture_agent' || userRole?.role === 'independent_agent';

  /**
   * Fetch profile ONLY
   * Never controls loading state
   * Never throws
   */
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Profile fetch error:', error);
        setProfile(null);
        return;
      }

      setProfile(data ?? null);
    } catch (err) {
      console.error('Unexpected profile error:', err);
      setProfile(null);
    }
  };

  /**
   * Fetch user role
   */
  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role, venture_id')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('User role fetch error:', error);
        setUserRole(null);
        return;
      }

      setUserRole(data ? { role: data.role, venture_id: data.venture_id } : null);
    } catch (err) {
      console.error('Unexpected user role error:', err);
      setUserRole(null);
    }
  };

  /**
   * AUTH STATE HANDLING — SINGLE SOURCE OF TRUTH
   */
  useEffect(() => {
    // Listen to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchProfile(session.user.id);
        fetchUserRole(session.user.id);
      } else {
        setProfile(null);
        setUserRole(null);
      }

      // 🔑 CRITICAL: loading must ALWAYS end here
      setLoading(false);
    });

    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchProfile(session.user.id);
        fetchUserRole(session.user.id);
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  /**
   * SIGN UP
   */
  const signUp = async (
    email: string,
    password: string,
    metadata: SignUpMetadata
  ) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: metadata.full_name,
            account_type: metadata.account_type,
            venture_name: metadata.venture_name,
          },
        },
      });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  /**
   * SIGN IN
   */
  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  /**
   * SIGN OUT
   */
  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setUserRole(null);
    toast.success('Signed out successfully');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        userRole,
        isVentureAdmin,
        isAgent,
        loading,
        signUp,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
