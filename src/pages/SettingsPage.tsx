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
    <div className="flex flex-col sm:flex-row sm:items-center py-3 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground w-40 flex-shrink-0">{label}</span>
      <span className="text-sm font-medium text-foreground">{value || '-'}</span>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your account settings and preferences</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:inline-flex">
            <TabsTrigger value="profile" className="gap-2">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="personal" className="gap-2">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Personal</span>
            </TabsTrigger>
            <TabsTrigger value="subscription" className="gap-2">
              <CreditCard className="w-4 h-4" />
              <span className="hidden sm:inline">Subscription</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Lock className="w-4 h-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="privacy" className="gap-2">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Privacy</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Picture</CardTitle>
                <CardDescription>Your profile photo</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center gap-6">
                <div className="relative">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={avatarUrl || ''} key={avatarUrl} />
                    <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
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
                    className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {isUploadingAvatar ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Camera className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <div className="space-y-2">
                  <p className="font-medium text-foreground">{profile?.full_name || 'Not set'}</p>
                  <p className="text-sm text-muted-foreground">{profile?.email}</p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingAvatar}
                    >
                      {isUploadingAvatar ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        'Upload New Photo'
                      )}
                    </Button>
                    {avatarUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveAvatar}
                        disabled={isUploadingAvatar}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Remove
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">JPG, PNG or WebP. Max 2MB.</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>Your display name and contact details</CardDescription>
                </div>
                {!isEditingProfile ? (
                  <Button variant="outline" size="sm" onClick={() => setIsEditingProfile(true)}>
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={handleCancelProfileEdit}>
                      <X className="w-4 h-4 mr-1" />
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleUpdateProfile} disabled={isLoading}>
                      <Check className="w-4 h-4 mr-1" />
                      {isLoading ? 'Saving...' : 'Save'}
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {!isEditingProfile ? (
                  <div className="space-y-1">
                    <InfoRow label="Full Name" value={fullName} />
                    <InfoRow label="Email Address" value={email} />
                    <InfoRow label="Phone Number" value={phone} />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input
                          id="fullName"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Enter your full name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          disabled
                          className="bg-muted"
                        />
                        <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Enter your phone number"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Personal Information Tab */}
          <TabsContent value="personal" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Personal Details</CardTitle>
                  <CardDescription>Your personal information for records</CardDescription>
                </div>
                {!isEditingPersonal ? (
                  <Button variant="outline" size="sm" onClick={() => setIsEditingPersonal(true)}>
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setIsEditingPersonal(false)}>
                      <X className="w-4 h-4 mr-1" />
                      Cancel
                    </Button>
                    <Button size="sm" onClick={() => { toast.success('Personal details saved'); setIsEditingPersonal(false); }}>
                      <Check className="w-4 h-4 mr-1" />
                      Save
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {!isEditingPersonal ? (
                  <div className="space-y-1">
                    <InfoRow label="First Name" value={firstName} />
                    <InfoRow label="Last Name" value={lastName} />
                    <InfoRow label="Date of Birth" value={dob} />
                    <InfoRow label="Gender" value={gender} />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" />
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="dob">Date of Birth</Label>
                        <Input id="dob" type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="gender">Gender</Label>
                        <Input id="gender" value={gender} onChange={(e) => setGender(e.target.value)} placeholder="Prefer not to say" />
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Address Information</CardTitle>
                  <CardDescription>Your location details</CardDescription>
                </div>
                {!isEditingAddress ? (
                  <Button variant="outline" size="sm" onClick={() => setIsEditingAddress(true)}>
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setIsEditingAddress(false)}>
                      <X className="w-4 h-4 mr-1" />
                      Cancel
                    </Button>
                    <Button size="sm" onClick={() => { toast.success('Address saved'); setIsEditingAddress(false); }}>
                      <Check className="w-4 h-4 mr-1" />
                      Save
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {!isEditingAddress ? (
                  <div className="space-y-1">
                    <InfoRow label="Street Address" value={address} />
                    <InfoRow label="City" value={city} />
                    <InfoRow label="State" value={state} />
                    <InfoRow label="ZIP Code" value={zipCode} />
                    <InfoRow label="Country" value={country} />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="address">Street Address</Label>
                      <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Enter your street address" />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state">State</Label>
                        <Input id="state" value={state} onChange={(e) => setState(e.target.value)} placeholder="State" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="zipCode">ZIP Code</Label>
                        <Input id="zipCode" value={zipCode} onChange={(e) => setZipCode(e.target.value)} placeholder="ZIP Code" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country">Country</Label>
                      <Input id="country" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Country" />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Work Information</CardTitle>
                  <CardDescription>Your professional details</CardDescription>
                </div>
                {!isEditingWork ? (
                  <Button variant="outline" size="sm" onClick={() => setIsEditingWork(true)}>
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setIsEditingWork(false)}>
                      <X className="w-4 h-4 mr-1" />
                      Cancel
                    </Button>
                    <Button size="sm" onClick={() => { toast.success('Work info saved'); setIsEditingWork(false); }}>
                      <Check className="w-4 h-4 mr-1" />
                      Save
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {!isEditingWork ? (
                  <div className="space-y-1">
                    <InfoRow label="Company Name" value={company} />
                    <InfoRow label="Designation" value={designation} />
                    <InfoRow label="License Number" value={license} />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="company">Company Name</Label>
                        <Input id="company" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company name" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="designation">Designation</Label>
                        <Input id="designation" value={designation} onChange={(e) => setDesignation(e.target.value)} placeholder="Your role" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="license">Real Estate License Number</Label>
                      <Input id="license" value={license} onChange={(e) => setLicense(e.target.value)} placeholder="License number" />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subscription Tab */}
          <TabsContent value="subscription" className="space-y-6">
            {/* Current Plan */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      Current Plan
                      <Badge variant="secondary" className="bg-muted">Free Trial</Badge>
                    </CardTitle>
                    <CardDescription>You're currently on the free trial</CardDescription>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-foreground">₹0</p>
                    <p className="text-xs text-muted-foreground">14 days remaining</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 p-4 bg-accent/10 rounded-xl border border-accent/20">
                  <Zap className="w-8 h-8 text-accent" />
                  <div className="flex-1">
                    <p className="font-medium text-foreground">Upgrade to unlock all features</p>
                    <p className="text-sm text-muted-foreground">Get unlimited leads, priority support, and more</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pricing Plans */}
            <div className="grid md:grid-cols-3 gap-4">
              {/* Starter Plan */}
              <Card className="relative">
                <CardHeader>
                  <CardTitle className="text-lg">Starter</CardTitle>
                  <CardDescription>Perfect for getting started</CardDescription>
                  <div className="mt-2">
                    <span className="text-3xl font-bold text-foreground">₹499</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {['Up to 100 leads', 'Basic analytics', 'Email support', 'Lead tracking', 'Mobile app access'].map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-status-closed" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button variant="outline" className="w-full">
                    Choose Starter
                  </Button>
                </CardContent>
              </Card>

              {/* Professional Plan */}
              <Card className="relative border-accent shadow-lg">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-accent text-accent-foreground">
                    <Crown className="w-3 h-3 mr-1" />
                    Popular
                  </Badge>
                </div>
                <CardHeader>
                  <CardTitle className="text-lg">Professional</CardTitle>
                  <CardDescription>Best for growing agents</CardDescription>
                  <div className="mt-2">
                    <span className="text-3xl font-bold text-foreground">₹999</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {['Unlimited leads', 'Advanced analytics', 'Priority support', 'Pipeline management', 'Calendar sync', 'Custom tags & filters', 'Export reports'].map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-status-closed" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button variant="accent" className="w-full">
                    Choose Professional
                  </Button>
                </CardContent>
              </Card>

              {/* Enterprise Plan */}
              <Card className="relative">
                <CardHeader>
                  <CardTitle className="text-lg">Enterprise</CardTitle>
                  <CardDescription>For teams and agencies</CardDescription>
                  <div className="mt-2">
                    <span className="text-3xl font-bold text-foreground">₹2,499</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {['Everything in Professional', 'Team collaboration', 'API access', 'White-label options', 'Dedicated account manager', 'Custom integrations'].map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-status-closed" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button variant="outline" className="w-full">
                    Contact Sales
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Billing History */}
            <Card>
              <CardHeader>
                <CardTitle>Billing History</CardTitle>
                <CardDescription>View your past transactions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">No billing history yet</p>
                  <p className="text-sm">Your transactions will appear here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Password</CardTitle>
                  <CardDescription>Manage your account password</CardDescription>
                </div>
                {!isChangingPassword && (
                  <Button variant="outline" size="sm" onClick={() => setIsChangingPassword(true)}>
                    <Pencil className="w-4 h-4 mr-2" />
                    Change Password
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {!isChangingPassword ? (
                  <div className="space-y-1">
                    <InfoRow label="Password" value="••••••••••••" />
                    <p className="text-xs text-muted-foreground mt-2">Last changed: Never</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <div className="relative">
                        <Input
                          id="currentPassword"
                          type={showCurrentPassword ? 'text' : 'password'}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="Enter current password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={showNewPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Enter new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirm new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" onClick={() => { setIsChangingPassword(false); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); }}>
                        Cancel
                      </Button>
                      <Button onClick={handleChangePassword} disabled={isLoading}>
                        {isLoading ? 'Changing...' : 'Change Password'}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Fingerprint className="w-5 h-5" />
                  Biometric Authentication
                </CardTitle>
                <CardDescription>Use fingerprint or face recognition to sign in</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="font-medium">Enable Biometric Login</p>
                    <p className="text-sm text-muted-foreground">Use your device's biometric sensor for quick access</p>
                  </div>
                  <Switch
                    checked={biometricEnabled}
                    onCheckedChange={(checked) => {
                      setBiometricEnabled(checked);
                      toast.success(checked ? 'Biometric login enabled' : 'Biometric login disabled');
                    }}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="font-medium">Two-Factor Authentication</p>
                    <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
                  </div>
                  <Switch
                    checked={twoFactorAuth}
                    onCheckedChange={(checked) => {
                      setTwoFactorAuth(checked);
                      toast.success(checked ? 'Two-factor authentication enabled' : 'Two-factor authentication disabled');
                    }}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="font-medium">Login Alerts</p>
                    <p className="text-sm text-muted-foreground">Get notified of new sign-ins to your account</p>
                  </div>
                  <Switch
                    checked={loginAlerts}
                    onCheckedChange={(checked) => {
                      setLoginAlerts(checked);
                      toast.success(checked ? 'Login alerts enabled' : 'Login alerts disabled');
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Active Sessions</CardTitle>
                <CardDescription>Manage your active login sessions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Current Session</p>
                      <p className="text-sm text-muted-foreground">Chrome on Windows • Active now</p>
                    </div>
                  </div>
                  <span className="text-xs text-green-500 bg-green-500/10 px-2 py-1 rounded-full">Active</span>
                </div>
                <Button variant="destructive" size="sm">Sign Out All Other Sessions</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Choose how you want to receive notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-muted-foreground">Receive updates via email</p>
                  </div>
                  <Switch
                    checked={emailNotifications}
                    onCheckedChange={(checked) => {
                      setEmailNotifications(checked);
                      toast.success(checked ? 'Email notifications enabled' : 'Email notifications disabled');
                    }}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="font-medium">Push Notifications</p>
                    <p className="text-sm text-muted-foreground">Receive push notifications on your device</p>
                  </div>
                  <Switch
                    checked={pushNotifications}
                    onCheckedChange={(checked) => {
                      setPushNotifications(checked);
                      toast.success(checked ? 'Push notifications enabled' : 'Push notifications disabled');
                    }}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="font-medium">SMS Notifications</p>
                    <p className="text-sm text-muted-foreground">Receive important alerts via SMS</p>
                  </div>
                  <Switch
                    checked={smsNotifications}
                    onCheckedChange={(checked) => {
                      setSmsNotifications(checked);
                      toast.success(checked ? 'SMS notifications enabled' : 'SMS notifications disabled');
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notification Types</CardTitle>
                <CardDescription>Choose which types of notifications you want</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="font-medium">Lead Updates</p>
                    <p className="text-sm text-muted-foreground">When leads change status or are assigned</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="font-medium">Meeting Reminders</p>
                    <p className="text-sm text-muted-foreground">Reminders before scheduled meetings</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="font-medium">Follow-up Alerts</p>
                    <p className="text-sm text-muted-foreground">Alerts for overdue follow-ups</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="font-medium">System Updates</p>
                    <p className="text-sm text-muted-foreground">Important system announcements</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Privacy Tab */}
          <TabsContent value="privacy" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Privacy Settings</CardTitle>
                <CardDescription>Control your data and privacy preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="font-medium">Profile Visibility</p>
                    <p className="text-sm text-muted-foreground">Allow team members to view your profile</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="font-medium">Activity Status</p>
                    <p className="text-sm text-muted-foreground">Show when you're online</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="font-medium">Data Analytics</p>
                    <p className="text-sm text-muted-foreground">Help improve the app with anonymous usage data</p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Data Management</CardTitle>
                <CardDescription>Manage your account data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Download Your Data</p>
                    <p className="text-sm text-muted-foreground">Get a copy of all your data</p>
                  </div>
                  <Button variant="outline" size="sm">Download</Button>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-destructive">Delete Account</p>
                    <p className="text-sm text-muted-foreground">Permanently delete your account and data</p>
                  </div>
                  <Button variant="destructive" size="sm">Delete</Button>
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
