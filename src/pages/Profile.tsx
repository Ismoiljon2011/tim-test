import { useState, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Lock, User, Camera, Save, Crop } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

const Profile = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Profile form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [fathersName, setFathersName] = useState('');
  const [school, setSchool] = useState('');
  const [age, setAge] = useState('');
  const [phone, setPhone] = useState('');
  const [profileLoaded, setProfileLoaded] = useState(false);

  // Image crop dialog
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [cropSize, setCropSize] = useState([80]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  // Load profile data into form
  if (profile && !profileLoaded) {
    setFirstName((profile as any).first_name || '');
    setLastName((profile as any).last_name || '');
    setFathersName((profile as any).fathers_name || '');
    setSchool((profile as any).school || '');
    setAge((profile as any).age?.toString() || '');
    setPhone(profile.phone || '');
    setProfileLoaded(true);
  }

  const handleSaveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);

    const { error } = await supabase
      .from('profiles')
      .update({
        first_name: firstName.trim() || null,
        last_name: lastName.trim() || null,
        fathers_name: fathersName.trim() || null,
        school: school.trim() || null,
        age: age ? parseInt(age) : null,
        phone: phone.trim() || null,
      } as any)
      .eq('user_id', user.id);

    setSavingProfile(false);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Profile updated successfully.' });
      queryClient.invalidateQueries({ queryKey: ['profile', user.id] });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setCropSize([80]);
    setCropDialogOpen(true);
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  const processAndUploadAvatar = async () => {
    if (!selectedFile || !user) return;
    setUploadingAvatar(true);

    try {
      // Create resized/cropped image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = URL.createObjectURL(selectedFile);
      });

      const size = 256; // Output size
      canvas.width = size;
      canvas.height = size;

      // Center crop
      const scale = cropSize[0] / 100;
      const srcSize = Math.min(img.width, img.height) * scale;
      const sx = (img.width - srcSize) / 2;
      const sy = (img.height - srcSize) / 2;

      ctx.drawImage(img, sx, sy, srcSize, srcSize, 0, 0, size, size);

      const blob = await new Promise<Blob>((resolve) =>
        canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.85)
      );

      const filePath = `${user.id}/avatar.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, blob, { cacheControl: '3600', upsert: true, contentType: 'image/jpeg' });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
      // Append timestamp to bust cache
      const avatarUrlWithCache = `${urlData.publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrlWithCache })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      toast({ title: 'Success', description: 'Avatar updated.' });
      queryClient.invalidateQueries({ queryKey: ['profile', user.id] });
      setCropDialogOpen(false);
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword) {
      toast({ title: 'Error', description: 'Please enter your current password.', variant: 'destructive' });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: 'Error', description: 'Password must be at least 6 characters.', variant: 'destructive' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: 'Error', description: 'Passwords do not match.', variant: 'destructive' });
      return;
    }

    setLoading(true);

    // Verify current password by attempting sign in
    const email = user?.email;
    if (email) {
      const { error: verifyError } = await supabase.auth.signInWithPassword({ email, password: currentPassword });
      if (verifyError) {
        toast({ title: 'Error', description: 'Current password is incorrect.', variant: 'destructive' });
        setLoading(false);
        return;
      }
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Password updated successfully.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  const username = profile?.display_name || profile?.username || 'User';
  const initials = username.slice(0, 2).toUpperCase();

  return (
    <div className="container max-w-2xl py-8 space-y-6">
      {/* Profile Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {t('nav.profile')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile?.avatar_url || undefined} alt={username} className="object-cover" />
                <AvatarFallback className="text-xl bg-primary text-primary-foreground">{initials}</AvatarFallback>
              </Avatar>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                disabled={uploadingAvatar}
              >
                <Camera className="h-5 w-5 text-white" />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
            </div>
            <div>
              <p className="text-lg font-medium">{username}</p>
              <p className="text-sm text-muted-foreground">@{profile?.username}</p>
            </div>
          </div>

          {/* Profile Fields */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>First Name *</Label>
              <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Enter first name" />
            </div>
            <div className="space-y-2">
              <Label>Last Name *</Label>
              <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Enter last name" />
            </div>
            <div className="space-y-2">
              <Label>Father's Name *</Label>
              <Input value={fathersName} onChange={(e) => setFathersName(e.target.value)} placeholder="Enter father's name" />
            </div>
            <div className="space-y-2">
              <Label>School *</Label>
              <Input value={school} onChange={(e) => setSchool(e.target.value)} placeholder="Enter school name" />
            </div>
            <div className="space-y-2">
              <Label>Age *</Label>
              <Input type="number" min={1} max={100} value={age} onChange={(e) => setAge(e.target.value)} placeholder="Enter age" />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+998 XX XXX XX XX" />
            </div>
          </div>

          <Button onClick={handleSaveProfile} disabled={savingProfile} className="w-full">
            <Save className="h-4 w-4 mr-2" />
            {savingProfile ? 'Saving...' : 'Save Profile'}
          </Button>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Change Password
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <div className="relative">
                <Input
                  id="current-password"
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  required
                />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowCurrent(!showCurrent)}>
                  {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowNew(!showNew)}>
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowConfirm(!showConfirm)}>
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Updating...' : 'Update Password'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Avatar Crop Dialog */}
      <Dialog open={cropDialogOpen} onOpenChange={(open) => { setCropDialogOpen(open); if (!open) { setSelectedFile(null); setPreviewUrl(null); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crop className="h-5 w-5" />
              Crop Profile Picture
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {previewUrl && (
              <div className="flex justify-center">
                <div className="w-48 h-48 rounded-full overflow-hidden border-2 border-primary">
                  <img
                    ref={imgRef}
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    style={{ transform: `scale(${100 / cropSize[0]})` }}
                  />
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label>Zoom</Label>
              <Slider
                value={cropSize}
                onValueChange={setCropSize}
                min={30}
                max={100}
                step={1}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCropDialogOpen(false)}>Cancel</Button>
            <Button onClick={processAndUploadAvatar} disabled={uploadingAvatar}>
              {uploadingAvatar ? 'Uploading...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;
