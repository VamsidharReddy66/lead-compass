import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Building2, Mail, Lock, Eye, EyeOff, User, Phone, Building, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

const SignupPage = () => {
  const navigate = useNavigate();
  const { signUp, user, loading: authLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [accountType, setAccountType] = useState<'independent_agent' | 'venture'>('independent_agent');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    companyName: '',
  });

  // Redirect if already logged in
  useEffect(() => {
  if (!authLoading && user) {
    navigate('/dashboard', { replace: true });
  }
}, [user, authLoading, navigate]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    
    const { error } = await signUp(formData.email, formData.password, {
      full_name: formData.name,
      account_type: accountType,
      venture_name: accountType === 'venture' ? formData.companyName : undefined,
    });

    if (error) {
      if (error.message.includes('already registered')) {
        toast.error('An account with this email already exists');
      } else {
        toast.error(error.message || 'Failed to create account');
      }
      setIsLoading(false);
    } else {
      toast.success('Account created successfully!');
      // Navigation will be handled by useEffect when auth state updates
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
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      {/* Mobile Header */}
      <div className="lg:hidden bg-hero-gradient p-6 pb-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-32 h-32 bg-accent/20 rounded-full blur-2xl" />
        <Link to="/" className="inline-flex items-center gap-2 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-background/20 backdrop-blur-sm flex items-center justify-center">
            <Building2 className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-xl text-primary-foreground">LeadFlow</span>
        </Link>
        <h1 className="font-display text-2xl font-bold text-primary-foreground mt-4 relative z-10">Create account</h1>
        <p className="text-primary-foreground/80 text-sm mt-1 relative z-10">Start your 14-day free trial</p>
      </div>

      {/* Desktop Left Visual */}
      <div className="hidden lg:flex flex-1 bg-hero-gradient items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-accent/10 rounded-full blur-2xl" />
        
        <div className="relative text-center max-w-md">
          <h2 className="font-display text-4xl font-bold text-primary-foreground mb-4">
            Start Your 14-Day Free Trial
          </h2>
          <p className="text-primary-foreground/80 text-lg mb-8">
            No credit card required. Get full access to all features.
          </p>
          <div className="space-y-4 text-left">
            {['Unlimited leads', 'Pipeline management', 'Follow-up reminders', 'Analytics dashboard'].map((feature) => (
              <div key={feature} className="flex items-center gap-3 text-primary-foreground/90">
                <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center">
                  <svg className="w-3 h-3 text-accent-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                {feature}
              </div>
            ))}
          </div>
        </div>
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
            <h1 className="font-display text-3xl font-bold text-foreground mb-2">Create your account</h1>
            <p className="text-muted-foreground">Start managing leads like a pro</p>
          </div>

          {/* Account Type Selector */}
          <div className="flex gap-2 lg:gap-3 mb-5 lg:mb-6">
            <button
              type="button"
              onClick={() => setAccountType('independent_agent')}
              className={`flex-1 p-3 lg:p-4 rounded-xl border-2 transition-all ${
                accountType === 'independent_agent'
                  ? 'border-accent bg-accent/5'
                  : 'border-border hover:border-accent/50'
              }`}
            >
              <User className={`w-5 h-5 lg:w-6 lg:h-6 mx-auto mb-1.5 lg:mb-2 ${accountType === 'independent_agent' ? 'text-accent' : 'text-muted-foreground'}`} />
              <div className={`text-xs lg:text-sm font-medium ${accountType === 'independent_agent' ? 'text-foreground' : 'text-muted-foreground'}`}>
                Independent
              </div>
            </button>
            <div
              className="flex-1 p-3 lg:p-4 rounded-xl border-2 border-border bg-muted/50 cursor-not-allowed relative"
            >
              <Building className="w-5 h-5 lg:w-6 lg:h-6 mx-auto mb-1.5 lg:mb-2 text-muted-foreground/50" />
              <div className="text-xs lg:text-sm font-medium text-muted-foreground/50">
                Venture
              </div>
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-xl">
                <span className="text-[10px] lg:text-xs font-medium text-muted-foreground px-2 py-1 bg-muted rounded-full">
                  Coming Soon
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3 lg:space-y-4">
            <div className="space-y-1.5 lg:space-y-2">
              <Label htmlFor="name" className="text-sm">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 lg:w-5 lg:h-5 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  className="pl-10 h-11 lg:h-12 text-sm lg:text-base"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
            </div>

            {accountType === 'venture' && (
              <div className="space-y-1.5 lg:space-y-2">
                <Label htmlFor="companyName" className="text-sm">Company Name</Label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 lg:w-5 lg:h-5 text-muted-foreground" />
                  <Input
                    id="companyName"
                    type="text"
                    placeholder="ABC Realty"
                    className="pl-10 h-11 lg:h-12 text-sm lg:text-base"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5 lg:space-y-2">
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

            <div className="space-y-1.5 lg:space-y-2">
              <Label htmlFor="phone" className="text-sm">Phone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 lg:w-5 lg:h-5 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+91 98765 43210"
                  className="pl-10 h-11 lg:h-12 text-sm lg:text-base"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5 lg:space-y-2">
              <Label htmlFor="password" className="text-sm">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 lg:w-5 lg:h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a strong password"
                  className="pl-10 pr-10 h-11 lg:h-12 text-sm lg:text-base"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={6}
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
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
            </Button>
          </form>

          <p className="text-center text-muted-foreground mt-4 lg:mt-6 text-xs lg:text-sm">
            By signing up, you agree to our{' '}
            <a href="#" className="text-accent hover:underline">Terms</a>
            {' '}and{' '}
            <a href="#" className="text-accent hover:underline">Privacy Policy</a>
          </p>

          <p className="text-center text-muted-foreground mt-3 lg:mt-4 text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-accent hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
