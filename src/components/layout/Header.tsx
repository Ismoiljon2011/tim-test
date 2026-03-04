import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Moon, Sun, LogOut, User, LayoutDashboard, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

export function Header() {
  const { user, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const queryClient = useQueryClient();

  const { signOut } = useAuth();
  
  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      const fetchProfile = () => {
        supabase
          .from('profiles')
          .select('username, display_name, avatar_url')
          .eq('user_id', user.id)
          .maybeSingle()
          .then(({ data }) => {
            setDisplayName(data?.display_name || data?.username || user.user_metadata?.username || 'User');
            setAvatarUrl(data?.avatar_url || null);
          });
      };
      fetchProfile();

      // Listen for profile query invalidation
      const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
        if (event?.type === 'updated' && event.query.queryKey[0] === 'profile') {
          fetchProfile();
        }
      });
      return () => unsubscribe();
    }
  }, [user, queryClient]);

  const username = displayName || user?.user_metadata?.username || 'User';
  const userInitials = username.slice(0, 2).toUpperCase();

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-lg"
    >
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <span className="text-lg font-bold text-primary-foreground">T</span>
          </div>
          <span className="text-xl font-bold">TIM-Test</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {user && (
            <>
              <Link to="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                {t('nav.dashboard')}
              </Link>
              <Link to="/tests" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                {t('nav.tests')}
              </Link>
              {isAdmin && (
                <Link to="/admin" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  {t('nav.admin')}
                </Link>
              )}
            </>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full">
            {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={avatarUrl || undefined} alt={username} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={avatarUrl || undefined} alt={username} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">{username}</p>
                    {isAdmin && (
                      <p className="text-xs text-muted-foreground">Administrator</p>
                    )}
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/dashboard" className="flex items-center">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    {t('nav.dashboard')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    {t('nav.profile')}
                  </Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin" className="flex items-center">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      {t('nav.adminPanel')}
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  {t('nav.signOut')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Button variant="ghost" asChild>
                <Link to="/auth">{t('nav.signIn')}</Link>
              </Button>
              <Button asChild>
                <Link to="/auth?mode=signup">{t('nav.getStarted')}</Link>
              </Button>
            </div>
          )}

          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="md:hidden border-t bg-background"
        >
          <nav className="container py-4 flex flex-col gap-2">
            {user ? (
              <>
                <Link to="/dashboard" className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-lg transition-colors" onClick={() => setMobileMenuOpen(false)}>
                  {t('nav.dashboard')}
                </Link>
                <Link to="/tests" className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-lg transition-colors" onClick={() => setMobileMenuOpen(false)}>
                  {t('nav.tests')}
                </Link>
                {isAdmin && (
                  <Link to="/admin" className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-lg transition-colors" onClick={() => setMobileMenuOpen(false)}>
                    {t('nav.adminPanel')}
                  </Link>
                )}
              </>
            ) : (
              <>
                <Link to="/auth" className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-lg transition-colors" onClick={() => setMobileMenuOpen(false)}>
                  {t('nav.signIn')}
                </Link>
                <Link to="/auth?mode=signup" className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg text-center" onClick={() => setMobileMenuOpen(false)}>
                  {t('nav.getStarted')}
                </Link>
              </>
            )}
          </nav>
        </motion.div>
      )}
    </motion.header>
  );
}
