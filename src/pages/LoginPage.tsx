import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Building2, Phone, Lock, Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

const LoginPage = () => {
  const navigate = useNavigate();
  const { signInWithPhone, verifyPhoneOtp, user, loading: authLoading, signOut } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, authLoading, navigate]);

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    // Limit to 10 digits
    return digits.slice(0, 10);
  };

  const getFullPhoneNumber = () => {
    // Add India country code
    return `+91${phone}`;
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (phone.length !== 10) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }

    setIsLoading(true);
    
    const { error } = await signInWithPhone(getFullPhoneNumber());
    
    if (error) {
      toast.error(error.message || 'Failed to send OTP');
      setIsLoading(false);
      return;
    }

    toast.success('OTP sent to your mobile number');
    setStep('otp');
    setIsLoading(false);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (otp.length !== 6) {
      toast.error('Please enter the 6-digit OTP');
      return;
    }

    setIsLoading(true);
    
    const { error } = await verifyPhoneOtp(getFullPhoneNumber(), otp);
    
    if (error) {
      toast.error(error.message || 'Invalid OTP');
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

  const handleBack = () => {
    setStep('phone');
    setOtp('');
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

          {step === 'phone' ? (
            <form onSubmit={handleSendOtp} className="space-y-4 lg:space-y-5">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm">Mobile Number</Label>
                <div className="relative flex">
                  <div className="flex items-center justify-center px-3 bg-muted border border-r-0 border-input rounded-l-md text-sm text-muted-foreground">
                    +91
                  </div>
                  <div className="relative flex-1">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 lg:w-5 lg:h-5 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="9876543210"
                      className="pl-10 h-11 lg:h-12 text-sm lg:text-base rounded-l-none"
                      value={phone}
                      onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
                      required
                      maxLength={10}
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">We'll send you a one-time password</p>
              </div>

              <Button type="submit" variant="accent" className="w-full h-11 lg:h-12 text-sm lg:text-base" disabled={isLoading}>
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send OTP'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4 lg:space-y-5">
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Change number
              </button>

              <div className="space-y-2">
                <Label className="text-sm">Enter OTP</Label>
                <p className="text-xs text-muted-foreground mb-3">
                  We've sent a 6-digit code to +91 {phone}
                </p>
                <div className="flex justify-center">
                  <InputOTP
                    value={otp}
                    onChange={setOtp}
                    maxLength={6}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </div>

              <Button type="submit" variant="accent" className="w-full h-11 lg:h-12 text-sm lg:text-base" disabled={isLoading}>
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify & Sign In'}
              </Button>

              <button
                type="button"
                onClick={handleSendOtp}
                className="w-full text-center text-sm text-accent hover:underline"
                disabled={isLoading}
              >
                Resend OTP
              </button>
            </form>
          )}

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
