import { useEffect, useState } from 'react';
import { Search, UserCog, Calendar, Shield, ShieldCheck, Crown, Key, Ban, Trash2, Copy, Check, Eye } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

interface User {
  id: string;
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  phone: string | null;
  first_name: string | null;
  last_name: string | null;
  fathers_name: string | null;
  school: string | null;
  age: number | null;
  role: 'user' | 'admin' | 'super_admin';
  is_banned?: boolean;
  ban_reason?: string | null;
}

export default function AdminUsers() {
  const { isSuperAdmin } = useAuth();
  const { t } = useLanguage();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [banReason, setBanReason] = useState('');
  const [tempPassword, setTempPassword] = useState('');
  const [copied, setCopied] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id, role');

      const rolesMap = new Map<string, string>();
      roles?.forEach((r) => {
        const current = rolesMap.get(r.user_id);
        if (r.role === 'super_admin' || (r.role === 'admin' && current !== 'super_admin')) {
          rolesMap.set(r.user_id, r.role);
        } else if (!current) {
          rolesMap.set(r.user_id, r.role);
        }
      });

      const usersWithRoles = (profiles || []).map((profile: any) => ({
        ...profile,
        role: (rolesMap.get(profile.user_id) || 'user') as 'user' | 'admin' | 'super_admin',
      }));

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not load users.' });
    } finally {
      setLoading(false);
    }
  };

  const toggleAdminRole = async (user: User) => {
    if (!isSuperAdmin) return;
    try {
      if (user.role === 'admin') {
        const { error } = await supabase.from('user_roles').delete().eq('user_id', user.user_id).eq('role', 'admin');
        if (error) throw error;
        toast({ title: 'Role updated', description: `${user.username} is no longer an admin.` });
      } else if (user.role === 'user') {
        const { error } = await supabase.from('user_roles').insert({ user_id: user.user_id, role: 'admin' });
        if (error) throw error;
        toast({ title: 'Role updated', description: `${user.username} is now an admin.` });
      }
      fetchUsers();
      setDialogOpen(false);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not update user role.' });
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      const res = await supabase.functions.invoke('admin-reset-password', {
        body: { user_id: selectedUser.user_id },
      });
      if (res.error) throw res.error;
      if (res.data?.error) throw new Error(res.data.error);
      setTempPassword(res.data.temp_password);
      toast({ title: 'Password reset', description: 'Temporary password generated.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleBanUser = async () => {
    if (!selectedUser || !banReason.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'Ban reason is required.' });
      return;
    }
    setActionLoading(true);
    try {
      const res = await supabase.functions.invoke('ban-user', {
        body: { user_id: selectedUser.user_id, ban: true, reason: banReason },
      });
      if (res.error) throw res.error;
      if (res.data?.error) throw new Error(res.data.error);
      toast({ title: 'User banned', description: `${selectedUser.username} has been banned.` });
      setBanDialogOpen(false);
      setBanReason('');
      fetchUsers();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnbanUser = async (user: User) => {
    setActionLoading(true);
    try {
      const res = await supabase.functions.invoke('ban-user', {
        body: { user_id: user.user_id, ban: false },
      });
      if (res.error) throw res.error;
      if (res.data?.error) throw new Error(res.data.error);
      toast({ title: 'User unbanned', description: `${user.username} has been unbanned.` });
      fetchUsers();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      const res = await supabase.functions.invoke('delete-user', {
        body: { user_id: selectedUser.user_id },
      });
      if (res.error) throw res.error;
      if (res.data?.error) throw new Error(res.data.error);
      toast({ title: 'User deleted', description: `${selectedUser.username} has been permanently deleted.` });
      setDeleteDialogOpen(false);
      fetchUsers();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setActionLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phone?.includes(searchQuery)
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <Badge className="bg-yellow-500 text-yellow-950"><Crown className="h-3 w-3 mr-1" />{t('adminUsers.superAdmin')}</Badge>;
      case 'admin':
        return <Badge className="bg-primary"><ShieldCheck className="h-3 w-3 mr-1" />{t('adminUsers.admin')}</Badge>;
      default:
        return <Badge variant="secondary"><Shield className="h-3 w-3 mr-1" />{t('adminUsers.regularUser')}</Badge>;
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{t('adminUsers.title')}</h1>
        <p className="text-muted-foreground">{t('adminUsers.manageAccounts')}</p>
      </div>

      <div className="relative max-w-sm mb-8">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t('adminUsers.searchUsers')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="pb-2"><CardDescription>{t('adminUsers.totalUsers')}</CardDescription></CardHeader>
          <CardContent><p className="text-2xl font-bold">{users.length}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardDescription>{t('adminUsers.administrators')}</CardDescription></CardHeader>
          <CardContent><p className="text-2xl font-bold">{users.filter((u) => u.role === 'admin' || u.role === 'super_admin').length}</p></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('adminUsers.allUsers')}</CardTitle>
          <CardDescription>{filteredUsers.length} {t('adminUsers.user')}{filteredUsers.length !== 1 ? 's' : ''}</CardDescription>
        </CardHeader>
        <CardContent className="overflow-hidden">
          {loading ? (
            <div className="h-64 bg-muted animate-pulse rounded-lg" />
          ) : filteredUsers.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">{t('adminUsers.noUsers')}</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('adminUsers.user')}</TableHead>
                    <TableHead>{t('adminUsers.username')}</TableHead>
                    <TableHead>{t('adminUsers.role')}</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>{t('adminUsers.joined')}</TableHead>
                    <TableHead className="text-right">{t('adminUsers.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id} className={user.is_banned ? 'opacity-60' : ''}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={user.avatar_url || undefined} />
                            <AvatarFallback>
                              {(user.display_name || user.username).slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{user.display_name || user.username}</span>
                        </div>
                      </TableCell>
                      <TableCell>@{user.username}</TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>
                        {user.is_banned ? (
                          <Badge variant="destructive">Banned</Badge>
                        ) : (
                          <Badge variant="outline" className="text-green-600 border-green-600">Active</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-muted-foreground text-sm">
                          <Calendar className="h-3 w-3" />
                          {formatDate(user.created_at)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* View Details button */}
                          <Button variant="outline" size="sm" onClick={() => { setSelectedUser(user); setDetailDialogOpen(true); }}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          {isSuperAdmin && user.role !== 'super_admin' && (
                            <>
                              <Button variant="outline" size="sm" onClick={() => { setSelectedUser(user); setTempPassword(''); setResetDialogOpen(true); }}>
                                <Key className="h-4 w-4" />
                              </Button>
                              {user.is_banned ? (
                                <Button variant="outline" size="sm" onClick={() => handleUnbanUser(user)}>
                                  Unban
                                </Button>
                              ) : (
                                <Button variant="outline" size="sm" onClick={() => { setSelectedUser(user); setBanReason(''); setBanDialogOpen(true); }}>
                                  <Ban className="h-4 w-4" />
                                </Button>
                              )}
                              <Button variant="outline" size="sm" className="text-destructive" onClick={() => { setSelectedUser(user); setDeleteDialogOpen(true); }}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          <Button variant="outline" size="sm" onClick={() => { setSelectedUser(user); setDialogOpen(true); }}>
                            <UserCog className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>Full profile information for {selectedUser?.display_name || selectedUser?.username}</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedUser.avatar_url || undefined} />
                  <AvatarFallback className="text-xl">{(selectedUser.display_name || selectedUser.username).slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-lg">{selectedUser.display_name || selectedUser.username}</p>
                  <p className="text-muted-foreground">@{selectedUser.username}</p>
                  {getRoleBadge(selectedUser.role)}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">First Name</p>
                  <p className="font-medium">{selectedUser.first_name || '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Last Name</p>
                  <p className="font-medium">{selectedUser.last_name || '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Father's Name</p>
                  <p className="font-medium">{selectedUser.fathers_name || '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Age</p>
                  <p className="font-medium">{selectedUser.age || '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">School</p>
                  <p className="font-medium">{selectedUser.school || '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Phone</p>
                  <p className="font-medium">{selectedUser.phone || '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Joined</p>
                  <p className="font-medium">{formatDate(selectedUser.created_at)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <p className="font-medium">{selectedUser.is_banned ? '🚫 Banned' : '✅ Active'}</p>
                </div>
                {selectedUser.is_banned && selectedUser.ban_reason && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Ban Reason</p>
                    <p className="font-medium text-destructive">{selectedUser.ban_reason}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Management Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('adminUsers.manageUser')}</DialogTitle>
            <DialogDescription>{t('adminUsers.updateSettings')} {selectedUser?.display_name || selectedUser?.username}</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedUser.avatar_url || undefined} />
                  <AvatarFallback className="text-xl">{(selectedUser.display_name || selectedUser.username).slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-lg">{selectedUser.display_name || selectedUser.username}</p>
                  <p className="text-muted-foreground">@{selectedUser.username}</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">{t('adminUsers.currentRole')}</p>
                {getRoleBadge(selectedUser.role)}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t('adminUsers.cancel')}</Button>
            {selectedUser && isSuperAdmin && selectedUser.role !== 'super_admin' && (
              <Button
                variant={selectedUser.role === 'admin' ? 'destructive' : 'default'}
                onClick={() => toggleAdminRole(selectedUser)}
              >
                {selectedUser.role === 'admin' ? t('adminUsers.removeAdminRole') : t('adminUsers.makeAdmin')}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Password Reset Dialog */}
      <Dialog open={resetDialogOpen} onOpenChange={(open) => { setResetDialogOpen(open); if (!open) setTempPassword(''); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('adminUsers.resetPassword')}</DialogTitle>
            <DialogDescription>Generate a temporary password for {selectedUser?.display_name || selectedUser?.username}</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {tempPassword ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Share this temporary password with the user. They will be required to change it on their next login.
                </p>
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg font-mono text-lg">
                  <span className="flex-1 select-all">{tempPassword}</span>
                  <Button variant="ghost" size="icon" onClick={() => copyToClipboard(tempPassword)}>
                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                This will generate a one-time temporary password. The user will be forced to change their password when they log in.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setResetDialogOpen(false); setTempPassword(''); }}>{t('adminUsers.cancel')}</Button>
            {!tempPassword && (
              <Button onClick={handleResetPassword} disabled={actionLoading}>
                {actionLoading ? 'Generating...' : 'Generate Temp Password'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ban User Dialog */}
      <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ban User</DialogTitle>
            <DialogDescription>Ban {selectedUser?.display_name || selectedUser?.username} from the platform</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>Ban Reason *</Label>
              <Textarea
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Enter the reason for banning this user..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBanDialogOpen(false)}>{t('adminUsers.cancel')}</Button>
            <Button variant="destructive" onClick={handleBanUser} disabled={actionLoading || !banReason.trim()}>
              {actionLoading ? 'Banning...' : 'Ban User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User Permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {selectedUser?.display_name || selectedUser?.username} and all their data. This action cannot be undone. Their username will become available for registration again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('adminUsers.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {actionLoading ? 'Deleting...' : 'Delete Permanently'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
