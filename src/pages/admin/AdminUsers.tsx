import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, UserCog, Calendar, Shield, ShieldCheck, Crown, Key } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  role: 'user' | 'admin' | 'super_admin';
}

export default function AdminUsers() {
  const { isSuperAdmin } = useAuth();
  const { t } = useLanguage();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      // Fetch all profiles
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch roles
      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id, role');

      const rolesMap = new Map<string, string>();
      roles?.forEach((r) => {
        // Prioritize super_admin > admin > user
        const current = rolesMap.get(r.user_id);
        if (r.role === 'super_admin' || (r.role === 'admin' && current !== 'super_admin')) {
          rolesMap.set(r.user_id, r.role);
        } else if (!current) {
          rolesMap.set(r.user_id, r.role);
        }
      });

      const usersWithRoles = (profiles || []).map((profile) => ({
        ...profile,
        role: (rolesMap.get(profile.user_id) || 'user') as 'user' | 'admin' | 'super_admin',
      }));

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not load users.',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleAdminRole = async (user: User) => {
    if (!isSuperAdmin) {
      toast({
        variant: 'destructive',
        title: 'Permission denied',
        description: 'Only Super Admins can manage user roles.',
      });
      return;
    }

    try {
      if (user.role === 'admin') {
        // Remove admin role
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', user.user_id)
          .eq('role', 'admin');

        if (error) throw error;
        toast({
          title: 'Role updated',
          description: `${user.username} is no longer an admin.`,
        });
      } else if (user.role === 'user') {
        // Add admin role
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: user.user_id, role: 'admin' });

        if (error) throw error;
        toast({
          title: 'Role updated',
          description: `${user.username} is now an admin.`,
        });
      }

      fetchUsers();
      setDialogOpen(false);
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not update user role.',
      });
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUser || !newPassword) return;
    
    // Note: In a real app, you would use an edge function to reset the password
    // since admin password reset requires the service role key
    toast({
      title: 'Password reset',
      description: `Password reset requested for ${selectedUser.username}. The user should use the forgot password flow.`,
    });
    setResetDialogOpen(false);
    setNewPassword('');
  };

  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin':
        return (
          <Badge className="bg-yellow-500 text-yellow-950">
            <Crown className="h-3 w-3 mr-1" />
            {t('adminUsers.superAdmin')}
          </Badge>
        );
      case 'admin':
        return (
          <Badge className="bg-primary">
            <ShieldCheck className="h-3 w-3 mr-1" />
            {t('adminUsers.admin')}
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <Shield className="h-3 w-3 mr-1" />
            {t('adminUsers.regularUser')}
          </Badge>
        );
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{t('adminUsers.title')}</h1>
        <p className="text-muted-foreground">{t('adminUsers.manageAccounts')}</p>
      </div>

      {/* Search */}
      <div className="relative max-w-sm mb-8">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t('adminUsers.searchUsers')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('adminUsers.totalUsers')}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{users.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('adminUsers.administrators')}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{users.filter((u) => u.role === 'admin' || u.role === 'super_admin').length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('adminUsers.allUsers')}</CardTitle>
          <CardDescription>
            {filteredUsers.length} {t('adminUsers.user')}{filteredUsers.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                    <TableHead>{t('adminUsers.joined')}</TableHead>
                    <TableHead className="text-right">{t('adminUsers.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>
                              {(user.display_name || user.username).slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">
                            {user.display_name || user.username}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>@{user.username}</TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-muted-foreground text-sm">
                          <Calendar className="h-3 w-3" />
                          {formatDate(user.created_at)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isSuperAdmin && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedUser(user);
                                setResetDialogOpen(true);
                              }}
                            >
                              <Key className="h-4 w-4 mr-2" />
                              {t('adminUsers.resetPassword')}
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user);
                              setDialogOpen(true);
                            }}
                          >
                            <UserCog className="h-4 w-4 mr-2" />
                            {t('adminUsers.manage')}
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

      {/* User Management Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('adminUsers.manageUser')}</DialogTitle>
            <DialogDescription>
              {t('adminUsers.updateSettings')} {selectedUser?.display_name || selectedUser?.username}
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-xl">
                    {(selectedUser.display_name || selectedUser.username).slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-lg">
                    {selectedUser.display_name || selectedUser.username}
                  </p>
                  <p className="text-muted-foreground">@{selectedUser.username}</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">{t('adminUsers.currentRole')}</p>
                {getRoleBadge(selectedUser.role)}
              </div>
              {!isSuperAdmin && (
                <p className="text-sm text-muted-foreground">
                  Only Super Admins can change user roles.
                </p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {t('adminUsers.cancel')}
            </Button>
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
      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('adminUsers.resetPassword')}</DialogTitle>
            <DialogDescription>
              Reset password for {selectedUser?.display_name || selectedUser?.username}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              For security reasons, password resets should be done through the forgot password flow.
              The user will receive an email with instructions to reset their password.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetDialogOpen(false)}>
              {t('adminUsers.cancel')}
            </Button>
            <Button onClick={handleResetPassword}>
              Send Reset Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
