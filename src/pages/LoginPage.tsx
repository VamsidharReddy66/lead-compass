import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Building2, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

const LoginPage = () => {
  const navigate = useNavigate();
  const { signIn, user, userRole, loading: authLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  // Redirect if already logged in
  useEffect(() => {
    if (user && userRole) {
      if (userRole.role === 'venture_admin') {
        navigate('/venture-dashboard');
      } else {
        navigate('/dashboard');
      }
    }
  }, [user, userRole, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const { error } = await signIn(formData.email, formData.password);
    
    if (error) {
      toast.error(error.message || 'Invalid email or password');
      setIsLoading(false);
    } else {
      toast.success('Welcome back!');
      // Navigation will be handled by useEffect
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <Link to="/" className="inline-flex items-center gap-2 mb-8">
              <div className="w-10 h-10 rounded-xl bg-hero-gradient flex items-center justify-center">
                <Building2 className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-xl text-foreground">LeadFlow</span>
            </Link>
            <h1 className="font-display text-3xl font-bold text-foreground mb-2">Welcome back</h1>
            <p className="text-muted-foreground">Sign in to continue managing your leads</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  className="pl-10 h-12"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link to="/forgot-password" className="text-sm text-accent hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="pl-10 pr-10 h-12"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button type="submit" variant="accent" className="w-full h-12" disabled={isLoading}>
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
            </Button>
          </form>

          <p className="text-center text-muted-foreground mt-6">
            Don't have an account?{' '}
            <Link to="/signup" className="text-accent hover:underline font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </div>

      {/* Right side - Visual */}
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
