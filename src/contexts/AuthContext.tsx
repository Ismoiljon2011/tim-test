import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type UserRole = 'user' | 'admin' | 'super_admin';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  userRole: UserRole;
  mustChangePassword: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, username: string, phone?: string, firstName?: string, lastName?: string, fathersName?: string, school?: string, age?: number) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  clearMustChangePassword: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>('user');
  const [mustChangePassword, setMustChangePassword] = useState(false);

  const checkAdminRole = async (userId: string) => {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);
    
    if (!error && data && data.length > 0) {
      const roles = data.map(r => r.role);
      const hasSuperAdmin = roles.includes('super_admin');
      const hasAdmin = roles.includes('admin');
      
      setIsSuperAdmin(hasSuperAdmin);
      setIsAdmin(hasSuperAdmin || hasAdmin);
      setUserRole(hasSuperAdmin ? 'super_admin' : hasAdmin ? 'admin' : 'user');
    } else {
      setIsAdmin(false);
      setIsSuperAdmin(false);
      setUserRole('user');
    }
  };

  const checkMustChangePassword = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('must_change_password, is_banned, ban_reason')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (data) {
      const profile = data as any;
      if (profile.is_banned) {
        // Sign out banned users
        const reason = profile.ban_reason || 'No reason provided';
        await supabase.auth.signOut();
        // Store ban message for display
        sessionStorage.setItem('ban_message', reason);
        return;
      }
      setMustChangePassword(!!profile.must_change_password);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        if (session?.user) {
          setTimeout(() => {
            checkAdminRole(session.user.id);
            checkMustChangePassword(session.user.id);
          }, 0);
        } else {
          setIsAdmin(false);
          setMustChangePassword(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (session?.user) {
        checkAdminRole(session.user.id);
        checkMustChangePassword(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signUp = async (
    email: string, password: string, username: string,
    phone?: string, firstName?: string, lastName?: string,
    fathersName?: string, school?: string, age?: number
  ) => {
    const redirectUrl = `${window.location.origin}/`;
    
    // Check blacklist
    const { data: blacklist } = await supabase
      .from('username_blacklist')
      .select('word');
    
    if (blacklist) {
      const lowerUsername = username.toLowerCase();
      const blocked = blacklist.some(b => lowerUsername.includes(b.word.toLowerCase()));
      if (blocked) {
        return { error: new Error('This username contains inappropriate language. Please choose another.') };
      }
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { username }
      }
    });

    if (error) {
      return { error: error as Error };
    }

    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: data.user.id,
          username,
          display_name: username,
          phone: phone || null,
          first_name: firstName || null,
          last_name: lastName || null,
          fathers_name: fathersName || null,
          school: school || null,
          age: age || null,
        } as any);
      
      if (profileError) {
        console.error('Profile creation error:', profileError);
      }

      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({ user_id: data.user.id, role: 'user' });
      
      if (roleError) {
        console.error('Role assignment error:', roleError);
      }
    }

    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setIsAdmin(false);
    setIsSuperAdmin(false);
    setUserRole('user');
    setMustChangePassword(false);
  };

  const clearMustChangePassword = () => {
    setMustChangePassword(false);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isAdmin, isSuperAdmin, userRole, mustChangePassword, signIn, signUp, signOut, clearMustChangePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
