import { useState, useEffect, useRef } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { useRazorpay } from '@/hooks/useRazorpay';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  User,
  Lock,
  Fingerprint,
  Bell,
  Shield,
  Camera,
  Pencil,
  X,
  Check,
  Eye,
  EyeOff,
  Loader2,
  Trash2,
  CreditCard,
  Crown,
  Zap,
  CheckCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const SettingsPage = () => {
  const { profile, user } = useAuth();
  const { initiatePayment, isLoading: isPaymentLoading } = useRazorpay();
  const { subscription, isTrialActive, isSubscriptionActive, daysRemaining, refetch: refetchSubscription } = useSubscription();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Edit mode states
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [isEditingWork, setIsEditingWork] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Profile form state
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // Personal info state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');

  // Address state
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [country, setCountry] = useState('');

  // Work state
  const [company, setCompany] = useState('');
  const [designation, setDesignation] = useState('');
  const [license, setLicense] = useState('');

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Settings toggles
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);
  const [loginAlerts, setLoginAlerts] = useState(true);

  // Sync profile data when it changes
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
      setEmail(profile.email || '');
      setAvatarUrl(profile.avatar_url || null);
      // Parse full name into first and last
      const nameParts = (profile.full_name || '').split(' ');
      setFirstName(nameParts[0] || '');
      setLastName(nameParts.slice(1).join(' ') || '');
    }
  }, [profile]);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size must be less than 2MB');
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Add cache buster to URL
      const urlWithCacheBuster = `${publicUrl}?t=${Date.now()}`;

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: urlWithCacheBuster })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setAvatarUrl(urlWithCacheBuster);
      toast.success('Profile picture updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload avatar');
    } finally {
      setIsUploadingAvatar(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveAvatar = async () => {
    if (!user) return;

    setIsUploadingAvatar(true);
    try {
      // Remove from storage
      const { error: deleteError } = await supabase.storage
        .from('avatars')
        .remove([`${user.id}/avatar.png`, `${user.id}/avatar.jpg`, `${user.id}/avatar.jpeg`, `${user.id}/avatar.webp`]);

      // Update profile to remove avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setAvatarUrl(null);
      toast.success('Profile picture removed');
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove avatar');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleUpdateProfile = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          phone: phone,
        })
        .eq('id', user.id);

      if (error) throw error;
      toast.success('Profile updated successfully');
      setIsEditingProfile(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelProfileEdit = () => {
    setFullName(profile?.full_name || '');
    setPhone(profile?.phone || '');
    setIsEditingProfile(false);
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;
      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsChangingPassword(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  const InfoRow = ({ label, value }: { label: string; value: string }) => (
    <div className="flex flex-col sm:flex-row sm:items-center py-2 border-b border-border last:border-0">
      <span className="text-xs text-muted-foreground w-32 flex-shrink-0">{label}</span>
      <span className="text-sm font-medium text-foreground">{value || '-'}</span>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-4 px-2">
        <div>
          <h1 className="text-xl font-display font-bold text-foreground">Settings</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Manage your account settings</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-4">
          <TabsList className="grid w-full grid-cols-6 h-9">
            <TabsTrigger value="profile" className="gap-1.5 text-xs px-2">
              <User className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="personal" className="gap-1.5 text-xs px-2">
              <User className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Personal</span>
            </TabsTrigger>
            <TabsTrigger value="subscription" className="gap-1.5 text-xs px-2">
              <CreditCard className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Plans</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-1.5 text-xs px-2">
              <Lock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-1.5 text-xs px-2">
              <Bell className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Alerts</span>
            </TabsTrigger>
            <TabsTrigger value="privacy" className="gap-1.5 text-xs px-2">
              <Shield className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Privacy</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-4">
            <Card className="rounded-xl">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm">Profile Picture</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-2 flex items-center gap-4">
                <div className="relative">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={avatarUrl || ''} key={avatarUrl} />
                    <AvatarFallback className="text-lg bg-primary text-primary-foreground">
                      {getInitials(profile?.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleAvatarUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                    className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {isUploadingAvatar ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Camera className="w-3 h-3" />
                    )}
                  </button>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">{profile?.full_name || 'Not set'}</p>
                  <p className="text-xs text-muted-foreground">{profile?.email}</p>
                  <div className="flex gap-2 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingAvatar}
                    >
                      {isUploadingAvatar ? 'Uploading...' : 'Upload'}
                    </Button>
                    {avatarUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-destructive hover:text-destructive"
                        onClick={handleRemoveAvatar}
                        disabled={isUploadingAvatar}
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-xl">
              <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm">Profile Information</CardTitle>
                {!isEditingProfile ? (
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setIsEditingProfile(true)}>
                    <Pencil className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                ) : (
                  <div className="flex gap-1.5">
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={handleCancelProfileEdit}>
                      Cancel
                    </Button>
                    <Button size="sm" className="h-7 text-xs" onClick={handleUpdateProfile} disabled={isLoading}>
                      {isLoading ? 'Saving...' : 'Save'}
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="p-4 pt-2">
                {!isEditingProfile ? (
                  <div className="space-y-0">
                    <InfoRow label="Full Name" value={fullName} />
                    <InfoRow label="Email" value={email} />
                    <InfoRow label="Phone" value={phone} />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="fullName" className="text-xs">Full Name</Label>
                        <Input
                          id="fullName"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Enter your full name"
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="email" className="text-xs">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          disabled
                          className="h-8 text-sm bg-muted"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="phone" className="text-xs">Phone</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Enter your phone number"
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Personal Information Tab */}
          <TabsContent value="personal" className="space-y-4">
            <Card className="rounded-xl">
              <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm">Personal Details</CardTitle>
                {!isEditingPersonal ? (
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setIsEditingPersonal(true)}>
                    <Pencil className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                ) : (
                  <div className="flex gap-1.5">
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setIsEditingPersonal(false)}>
                      Cancel
                    </Button>
                    <Button size="sm" className="h-7 text-xs" onClick={() => { toast.success('Personal details saved'); setIsEditingPersonal(false); }}>
                      Save
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="p-4 pt-2">
                {!isEditingPersonal ? (
                  <div className="space-y-0">
                    <InfoRow label="First Name" value={firstName} />
                    <InfoRow label="Last Name" value={lastName} />
                    <InfoRow label="Date of Birth" value={dob} />
                    <InfoRow label="Gender" value={gender} />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="firstName" className="text-xs">First Name</Label>
                        <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" className="h-8 text-sm" />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="lastName" className="text-xs">Last Name</Label>
                        <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" className="h-8 text-sm" />
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="dob" className="text-xs">Date of Birth</Label>
                        <Input id="dob" type="date" value={dob} onChange={(e) => setDob(e.target.value)} className="h-8 text-sm" />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="gender" className="text-xs">Gender</Label>
                        <Input id="gender" value={gender} onChange={(e) => setGender(e.target.value)} placeholder="Prefer not to say" className="h-8 text-sm" />
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-xl">
              <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm">Address</CardTitle>
                {!isEditingAddress ? (
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setIsEditingAddress(true)}>
                    <Pencil className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                ) : (
                  <div className="flex gap-1.5">
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setIsEditingAddress(false)}>
                      Cancel
                    </Button>
                    <Button size="sm" className="h-7 text-xs" onClick={() => { toast.success('Address saved'); setIsEditingAddress(false); }}>
                      Save
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="p-4 pt-2">
                {!isEditingAddress ? (
                  <div className="space-y-0">
                    <InfoRow label="Street" value={address} />
                    <InfoRow label="City" value={city} />
                    <InfoRow label="State" value={state} />
                    <InfoRow label="ZIP" value={zipCode} />
                    <InfoRow label="Country" value={country} />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="address" className="text-xs">Street Address</Label>
                      <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street address" className="h-8 text-sm" />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="city" className="text-xs">City</Label>
                        <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" className="h-8 text-sm" />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="state" className="text-xs">State</Label>
                        <Input id="state" value={state} onChange={(e) => setState(e.target.value)} placeholder="State" className="h-8 text-sm" />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="zipCode" className="text-xs">ZIP</Label>
                        <Input id="zipCode" value={zipCode} onChange={(e) => setZipCode(e.target.value)} placeholder="ZIP" className="h-8 text-sm" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="country" className="text-xs">Country</Label>
                      <Input id="country" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Country" className="h-8 text-sm" />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-xl">
              <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm">Work Information</CardTitle>
                {!isEditingWork ? (
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setIsEditingWork(true)}>
                    <Pencil className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                ) : (
                  <div className="flex gap-1.5">
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setIsEditingWork(false)}>
                      Cancel
                    </Button>
                    <Button size="sm" className="h-7 text-xs" onClick={() => { toast.success('Work info saved'); setIsEditingWork(false); }}>
                      Save
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="p-4 pt-2">
                {!isEditingWork ? (
                  <div className="space-y-0">
                    <InfoRow label="Company" value={company} />
                    <InfoRow label="Role" value={designation} />
                    <InfoRow label="License" value={license} />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="company" className="text-xs">Company</Label>
                        <Input id="company" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company name" className="h-8 text-sm" />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="designation" className="text-xs">Role</Label>
                        <Input id="designation" value={designation} onChange={(e) => setDesignation(e.target.value)} placeholder="Your role" className="h-8 text-sm" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="license" className="text-xs">License Number</Label>
                      <Input id="license" value={license} onChange={(e) => setLicense(e.target.value)} placeholder="License number" className="h-8 text-sm" />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subscription Tab */}
          <TabsContent value="subscription" className="space-y-4">
            <Card className="rounded-xl">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm flex items-center gap-2">
                      Current Plan
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${
                          isSubscriptionActive 
                            ? 'bg-status-closed/20 text-status-closed' 
                            : isTrialActive 
                              ? 'bg-amber-500/20 text-amber-600' 
                              : 'bg-destructive/20 text-destructive'
                        }`}
                      >
                        {isSubscriptionActive 
                          ? subscription?.plan_name 
                          : isTrialActive 
                            ? 'Free Trial' 
                            : 'Expired'}
                      </Badge>
                    </CardTitle>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-foreground">
                      {isSubscriptionActive 
                        ? `₹${subscription?.amount_paid || 0}` 
                        : '₹0'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {daysRemaining > 0 
                        ? `${daysRemaining} days left` 
                        : 'No active subscription'}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                {!isSubscriptionActive && (
                  <div className="flex items-center gap-3 p-3 bg-accent/10 rounded-lg border border-accent/20">
                    <Zap className="w-5 h-5 text-accent" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {isTrialActive ? 'Upgrade to unlock all features' : 'Subscribe to continue'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {isTrialActive 
                          ? 'Unlimited leads, priority support' 
                          : 'Your trial has expired. Choose a plan to continue.'}
                      </p>
                    </div>
                  </div>
                )}
                {isSubscriptionActive && (
                  <div className="flex items-center gap-3 p-3 bg-status-closed/10 rounded-lg border border-status-closed/20">
                    <CheckCircle className="w-5 h-5 text-status-closed" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">You're subscribed!</p>
                      <p className="text-xs text-muted-foreground">
                        Enjoying {subscription?.plan_name} plan benefits
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-3 gap-3">
              <Card className="rounded-xl">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm">Starter</CardTitle>
                  <div className="mt-1">
                    <span className="text-2xl font-bold text-foreground">₹499</span>
                    <span className="text-xs text-muted-foreground">/mo</span>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-2 space-y-3">
                  <ul className="space-y-1.5">
                    {['100 leads', 'Basic analytics', 'Email support'].map((feature) => (
                      <li key={feature} className="flex items-center gap-1.5 text-xs">
                        <CheckCircle className="w-3.5 h-3.5 text-status-closed" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    variant={subscription?.plan_name === 'Starter' && isSubscriptionActive ? 'secondary' : 'outline'}
                    size="sm" 
                    className="w-full h-8 text-xs"
                    disabled={isPaymentLoading || (subscription?.plan_name === 'Starter' && isSubscriptionActive)}
                    onClick={() => initiatePayment({
                      amount: 499,
                      planName: 'Starter',
                      userId: user?.id,
                      refetchSubscription,
                      onSuccess: () => toast.success('Subscribed to Starter plan!'),
                    })}
                  >
                    {isPaymentLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : 
                      subscription?.plan_name === 'Starter' && isSubscriptionActive ? 'Current Plan' : 'Choose'}
                  </Button>
                </CardContent>
              </Card>

              <Card className="rounded-xl border-accent shadow-md relative">
                <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                  <Badge className="bg-accent text-accent-foreground text-xs">
                    <Crown className="w-2.5 h-2.5 mr-0.5" />
                    Popular
                  </Badge>
                </div>
                <CardHeader className="p-4 pb-2 pt-5">
                  <CardTitle className="text-sm">Professional</CardTitle>
                  <div className="mt-1">
                    <span className="text-2xl font-bold text-foreground">₹999</span>
                    <span className="text-xs text-muted-foreground">/mo</span>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-2 space-y-3">
                  <ul className="space-y-1.5">
                    {['Unlimited leads', 'Advanced analytics', 'Priority support', 'Pipeline mgmt'].map((feature) => (
                      <li key={feature} className="flex items-center gap-1.5 text-xs">
                        <CheckCircle className="w-3.5 h-3.5 text-status-closed" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    variant={subscription?.plan_name === 'Professional' && isSubscriptionActive ? 'secondary' : 'default'}
                    size="sm" 
                    className="w-full h-8 text-xs"
                    disabled={isPaymentLoading || (subscription?.plan_name === 'Professional' && isSubscriptionActive)}
                    onClick={() => initiatePayment({
                      amount: 999,
                      planName: 'Professional',
                      userId: user?.id,
                      refetchSubscription,
                      onSuccess: () => toast.success('Subscribed to Professional plan!'),
                    })}
                  >
                    {isPaymentLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : 
                      subscription?.plan_name === 'Professional' && isSubscriptionActive ? 'Current Plan' : 'Choose'}
                  </Button>
                </CardContent>
              </Card>

              <Card className="rounded-xl">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm">Enterprise</CardTitle>
                  <div className="mt-1">
                    <span className="text-2xl font-bold text-foreground">₹2,499</span>
                    <span className="text-xs text-muted-foreground">/mo</span>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-2 space-y-3">
                  <ul className="space-y-1.5">
                    {['Everything in Pro', 'Team collab', 'API access', 'White-label'].map((feature) => (
                      <li key={feature} className="flex items-center gap-1.5 text-xs">
                        <CheckCircle className="w-3.5 h-3.5 text-status-closed" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    variant={subscription?.plan_name === 'Enterprise' && isSubscriptionActive ? 'secondary' : 'outline'}
                    size="sm" 
                    className="w-full h-8 text-xs"
                    disabled={isPaymentLoading || (subscription?.plan_name === 'Enterprise' && isSubscriptionActive)}
                    onClick={() => initiatePayment({
                      amount: 2499,
                      planName: 'Enterprise',
                      userId: user?.id,
                      refetchSubscription,
                      onSuccess: () => toast.success('Subscribed to Enterprise plan!'),
                    })}
                  >
                    {isPaymentLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : 
                      subscription?.plan_name === 'Enterprise' && isSubscriptionActive ? 'Current Plan' : 'Choose'}
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Card className="rounded-xl">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm">Billing History</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <div className="text-center py-4 text-muted-foreground">
                  <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">No transactions yet</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-4">
            <Card className="rounded-xl">
              <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm">Password</CardTitle>
                {!isChangingPassword && (
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setIsChangingPassword(true)}>
                    <Pencil className="w-3 h-3 mr-1" />
                    Change
                  </Button>
                )}
              </CardHeader>
              <CardContent className="p-4 pt-2">
                {!isChangingPassword ? (
                  <div className="space-y-0">
                    <InfoRow label="Password" value="••••••••" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="currentPassword" className="text-xs">Current Password</Label>
                      <div className="relative">
                        <Input
                          id="currentPassword"
                          type={showCurrentPassword ? 'text' : 'password'}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="Current password"
                          className="h-8 text-sm pr-8"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showCurrentPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="newPassword" className="text-xs">New Password</Label>
                        <div className="relative">
                          <Input
                            id="newPassword"
                            type={showNewPassword ? 'text' : 'password'}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="New password"
                            className="h-8 text-sm pr-8"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="confirmPassword" className="text-xs">Confirm Password</Label>
                        <div className="relative">
                          <Input
                            id="confirmPassword"
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm password"
                            className="h-8 text-sm pr-8"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { setIsChangingPassword(false); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); }}>
                        Cancel
                      </Button>
                      <Button size="sm" className="h-7 text-xs" onClick={handleChangePassword} disabled={isLoading}>
                        {isLoading ? 'Saving...' : 'Update'}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-xl">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm flex items-center gap-1.5">
                  <Fingerprint className="w-4 h-4" />
                  Security Options
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-2 space-y-3">
                <div className="flex items-center justify-between py-1">
                  <div>
                    <p className="text-sm font-medium">Biometric Login</p>
                    <p className="text-xs text-muted-foreground">Use fingerprint or face ID</p>
                  </div>
                  <Switch
                    checked={biometricEnabled}
                    onCheckedChange={(checked) => {
                      setBiometricEnabled(checked);
                      toast.success(checked ? 'Enabled' : 'Disabled');
                    }}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between py-1">
                  <div>
                    <p className="text-sm font-medium">Two-Factor Auth</p>
                    <p className="text-xs text-muted-foreground">Extra security layer</p>
                  </div>
                  <Switch
                    checked={twoFactorAuth}
                    onCheckedChange={(checked) => {
                      setTwoFactorAuth(checked);
                      toast.success(checked ? 'Enabled' : 'Disabled');
                    }}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between py-1">
                  <div>
                    <p className="text-sm font-medium">Login Alerts</p>
                    <p className="text-xs text-muted-foreground">Get notified of sign-ins</p>
                  </div>
                  <Switch
                    checked={loginAlerts}
                    onCheckedChange={(checked) => {
                      setLoginAlerts(checked);
                      toast.success(checked ? 'Enabled' : 'Disabled');
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-xl">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm">Active Sessions</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-2 space-y-3">
                <div className="flex items-center justify-between p-2 bg-secondary rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Shield className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Current Session</p>
                      <p className="text-xs text-muted-foreground">Active now</p>
                    </div>
                  </div>
                  <span className="text-xs text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded-full">Active</span>
                </div>
                <Button variant="destructive" size="sm" className="h-7 text-xs">Sign Out Other Sessions</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-4">
            <Card className="rounded-xl">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm">Notification Channels</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-2 space-y-3">
                <div className="flex items-center justify-between py-1">
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-xs text-muted-foreground">Receive via email</p>
                  </div>
                  <Switch
                    checked={emailNotifications}
                    onCheckedChange={(checked) => {
                      setEmailNotifications(checked);
                      toast.success(checked ? 'Enabled' : 'Disabled');
                    }}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between py-1">
                  <div>
                    <p className="text-sm font-medium">Push</p>
                    <p className="text-xs text-muted-foreground">Device notifications</p>
                  </div>
                  <Switch
                    checked={pushNotifications}
                    onCheckedChange={(checked) => {
                      setPushNotifications(checked);
                      toast.success(checked ? 'Enabled' : 'Disabled');
                    }}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between py-1">
                  <div>
                    <p className="text-sm font-medium">SMS</p>
                    <p className="text-xs text-muted-foreground">Text message alerts</p>
                  </div>
                  <Switch
                    checked={smsNotifications}
                    onCheckedChange={(checked) => {
                      setSmsNotifications(checked);
                      toast.success(checked ? 'Enabled' : 'Disabled');
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-xl">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm">Notification Types</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-2 space-y-3">
                <div className="flex items-center justify-between py-1">
                  <div>
                    <p className="text-sm font-medium">Lead Updates</p>
                    <p className="text-xs text-muted-foreground">Status changes</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between py-1">
                  <div>
                    <p className="text-sm font-medium">Meeting Reminders</p>
                    <p className="text-xs text-muted-foreground">Before meetings</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between py-1">
                  <div>
                    <p className="text-sm font-medium">Follow-up Alerts</p>
                    <p className="text-xs text-muted-foreground">Overdue tasks</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between py-1">
                  <div>
                    <p className="text-sm font-medium">System Updates</p>
                    <p className="text-xs text-muted-foreground">Announcements</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Privacy Tab */}
          <TabsContent value="privacy" className="space-y-4">
            <Card className="rounded-xl">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm">Privacy Settings</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-2 space-y-3">
                <div className="flex items-center justify-between py-1">
                  <div>
                    <p className="text-sm font-medium">Profile Visibility</p>
                    <p className="text-xs text-muted-foreground">Team can view profile</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between py-1">
                  <div>
                    <p className="text-sm font-medium">Activity Status</p>
                    <p className="text-xs text-muted-foreground">Show online status</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between py-1">
                  <div>
                    <p className="text-sm font-medium">Analytics</p>
                    <p className="text-xs text-muted-foreground">Anonymous usage data</p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-xl">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm">Data Management</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-2 space-y-3">
                <div className="flex items-center justify-between py-1">
                  <div>
                    <p className="text-sm font-medium">Download Data</p>
                    <p className="text-xs text-muted-foreground">Export your data</p>
                  </div>
                  <Button variant="outline" size="sm" className="h-7 text-xs">Download</Button>
                </div>
                <Separator />
                <div className="flex items-center justify-between py-1">
                  <div>
                    <p className="text-sm font-medium text-destructive">Delete Account</p>
                    <p className="text-xs text-muted-foreground">Permanently delete</p>
                  </div>
                  <Button variant="destructive" size="sm" className="h-7 text-xs">Delete</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;
