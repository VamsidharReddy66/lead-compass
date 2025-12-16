import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type AppRole = 'super_admin' | 'venture_admin' | 'venture_agent' | 'independent_agent';
type AccountType = 'independent_agent' | 'venture';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  account_type: AccountType;
  venture_id: string | null;
}

interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  venture_id: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  userRole: UserRole | null;
  loading: boolean;
  signUp: (email: string, password: string, metadata: SignUpMetadata) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  isVentureAdmin: boolean;
  isAgent: boolean;
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

  const fetchUserData = async (userId: string) => {
    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Fetch role
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (roleError) throw roleError;
      setUserRole(roleData);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer fetching profile data
        if (session?.user) {
          setTimeout(() => {
            fetchUserData(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setUserRole(null);
        }
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, metadata: SignUpMetadata) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: metadata.full_name,
            account_type: metadata.account_type,
            venture_name: metadata.venture_name,
          }
        }
      });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setUserRole(null);
    toast.success('Signed out successfully');
  };

  const isVentureAdmin = userRole?.role === 'venture_admin';
  const isAgent = userRole?.role === 'independent_agent' || userRole?.role === 'venture_agent';

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      userRole,
      loading,
      signUp,
      signIn,
      signOut,
      isVentureAdmin,
      isAgent
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
