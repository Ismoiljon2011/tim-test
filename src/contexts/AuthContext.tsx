import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
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
  const initializedRef = useRef(false);

  const checkAdminRole = async (userId: string) => {
    try {
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
    } catch {
      setIsAdmin(false);
      setIsSuperAdmin(false);
      setUserRole('user');
    }
  };

  const checkMustChangePassword = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('must_change_password, is_banned, ban_reason')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (data) {
        const profile = data as any;
        if (profile.is_banned) {
          const reason = profile.ban_reason || 'No reason provided';
          await supabase.auth.signOut();
          sessionStorage.setItem('ban_message', reason);
          return;
        }
        setMustChangePassword(!!profile.must_change_password);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    // 1. Set up listener FIRST (but don't set loading=false from it on initial)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        // Skip the INITIAL_SESSION event — getSession handles initialization
        if (event === 'INITIAL_SESSION') return;
        
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        if (newSession?.user) {
          // Fire and forget — don't await inside callback
          checkAdminRole(newSession.user.id);
          checkMustChangePassword(newSession.user.id);
        } else {
          setIsAdmin(false);
          setIsSuperAdmin(false);
          setUserRole('user');
          setMustChangePassword(false);
        }
      }
    );

    // 2. Then restore session from storage
    supabase.auth.getSession().then(async ({ data: { session: restoredSession } }) => {
      if (initializedRef.current) return;
      initializedRef.current = true;
      
      setSession(restoredSession);
      setUser(restoredSession?.user ?? null);
      
      if (restoredSession?.user) {
        await Promise.all([
          checkAdminRole(restoredSession.user.id),
          checkMustChangePassword(restoredSession.user.id),
        ]);
      }
      
      setLoading(false);
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
