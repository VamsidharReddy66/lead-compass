import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Building2, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

const LoginPage = () => {
  const navigate = useNavigate();
  const { signIn, user, loading: authLoading, signOut } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  // Redirect if already logged in
  useEffect(() => {
  if (!authLoading && user) {
    navigate('/dashboard', { replace: true });
  }
}, [user, authLoading, navigate]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const { error } = await signIn(formData.email, formData.password);
    
    if (error) {
      toast.error(error.message || 'Invalid email or password');
      setIsLoading(false);
      return;
    }

    // Check if the user is a venture account
    const { data: { user: loggedInUser } } = await supabase.auth.getUser();
    if (loggedInUser) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('account_type')
        .eq('id', loggedInUser.id)
        .single();

      if (profile?.account_type === 'venture') {
        await signOut();
        toast.error('Venture accounts are coming soon! Currently under development.');
        setIsLoading(false);
        return;
      }
    }

    toast.success('Welcome back!');
    // Navigation will be handled by useEffect
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      {/* Mobile Header */}
      <div className="lg:hidden bg-hero-gradient p-6 pb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-accent/20 rounded-full blur-2xl" />
        <Link to="/" className="inline-flex items-center gap-2 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-background/20 backdrop-blur-sm flex items-center justify-center">
            <Building2 className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-xl text-primary-foreground">LeadFlow</span>
        </Link>
        <h1 className="font-display text-2xl font-bold text-primary-foreground mt-4 relative z-10">Welcome back</h1>
        <p className="text-primary-foreground/80 text-sm mt-1 relative z-10">Sign in to continue</p>
      </div>

      {/* Form Section */}
      <div className="flex-1 flex items-start lg:items-center justify-center p-6 lg:p-8 -mt-4 lg:mt-0">
        <div className="w-full max-w-md bg-card lg:bg-transparent rounded-2xl lg:rounded-none p-6 lg:p-0 shadow-card lg:shadow-none">
          {/* Desktop Header */}
          <div className="mb-6 lg:mb-8 hidden lg:block">
            <Link to="/" className="inline-flex items-center gap-2 mb-8">
              <div className="w-10 h-10 rounded-xl bg-hero-gradient flex items-center justify-center">
                <Building2 className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-xl text-foreground">LeadFlow</span>
            </Link>
            <h1 className="font-display text-3xl font-bold text-foreground mb-2">Welcome back</h1>
            <p className="text-muted-foreground">Sign in to continue managing your leads</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 lg:w-5 lg:h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  className="pl-10 h-11 lg:h-12 text-sm lg:text-base"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm">Password</Label>
                <Link to="/forgot-password" className="text-xs lg:text-sm text-accent hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 lg:w-5 lg:h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="pl-10 pr-10 h-11 lg:h-12 text-sm lg:text-base"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4 lg:w-5 lg:h-5" /> : <Eye className="w-4 h-4 lg:w-5 lg:h-5" />}
                </button>
              </div>
            </div>

            <Button type="submit" variant="accent" className="w-full h-11 lg:h-12 text-sm lg:text-base" disabled={isLoading}>
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
            </Button>
          </form>

          <p className="text-center text-muted-foreground mt-6 text-sm">
            Don't have an account?{' '}
            <Link to="/signup" className="text-accent hover:underline font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </div>

      {/* Desktop Right Visual */}
      <div className="hidden lg:flex flex-1 bg-hero-gradient items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/10 rounded-full blur-2xl" />
        
        <div className="relative text-center max-w-md">
          <h2 className="font-display text-4xl font-bold text-primary-foreground mb-4">
            Manage Your Real Estate Leads Effortlessly
          </h2>
          <p className="text-primary-foreground/80 text-lg">
            Track every lead, never miss a follow-up, and close more deals with our intelligent CRM.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
