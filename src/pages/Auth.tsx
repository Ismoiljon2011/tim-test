import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Lock, User, ArrowRight, Phone, UserPlus, LogIn, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

const signInSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(20, 'Username must be less than 20 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signUpSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(20, 'Username must be less than 20 characters'),
  phone: z.string().min(1, 'Phone or email is required').max(50, 'Too long'),
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  fathersName: z.string().min(1, "Father's name is required").max(50),
  school: z.string().min(1, 'School is required').max(100),
  age: z.string().min(1, 'Age is required').refine(v => { const n = parseInt(v); return n >= 5 && n <= 100; }, 'Age must be between 5 and 100'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type SignInFormData = z.infer<typeof signInSchema>;
type SignUpFormData = z.infer<typeof signUpSchema>;

const usernameToEmail = (username: string) => `${username.toLowerCase()}@testplatform.internal`;

export default function Auth() {
  const [searchParams] = useSearchParams();
  const [isSignUp, setIsSignUp] = useState(searchParams.get('mode') === 'signup');
  const [isLoading, setIsLoading] = useState(false);
  const { user, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();

  // Check for ban message
  const banMessage = sessionStorage.getItem('ban_message');
  useEffect(() => {
    if (banMessage) {
      sessionStorage.removeItem('ban_message');
    }
  }, []);

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const signInForm = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: { username: '', password: '' },
  });

  const signUpForm = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { username: '', phone: '', firstName: '', lastName: '', fathersName: '', school: '', age: '', password: '', confirmPassword: '' },
  });

  const handleSignIn = async (data: SignInFormData) => {
    setIsLoading(true);
    const email = usernameToEmail(data.username);
    const { error } = await signIn(email, data.password);
    setIsLoading(false);

    if (error) {
      // Check if banned
      const banMsg = sessionStorage.getItem('ban_message');
      if (banMsg) {
        sessionStorage.removeItem('ban_message');
        toast({
          variant: 'destructive',
          title: 'Account Banned',
          description: `This account has been banned by the administrator. Reason: ${banMsg}`,
        });
        return;
      }
      toast({
        variant: 'destructive',
        title: t('auth.signInFailed'),
        description: error.message === 'Invalid login credentials'
          ? t('auth.invalidCredentials')
          : error.message,
      });
    } else {
      toast({ title: t('auth.welcomeBack'), description: t('auth.signInSuccess') });
      navigate('/dashboard');
    }
  };

  const handleSignUp = async (data: SignUpFormData) => {
    setIsLoading(true);
    const email = usernameToEmail(data.username);
    const { error } = await signUp(
      email, data.password, data.username, data.phone,
      data.firstName, data.lastName, data.fathersName, data.school, parseInt(data.age)
    );
    setIsLoading(false);

    if (error) {
      let message = error.message;
      if (message.includes('already registered')) {
        message = t('auth.usernameTaken');
      }
      toast({ variant: 'destructive', title: t('auth.signUpFailed'), description: message });
    } else {
      toast({ title: t('auth.accountCreated'), description: t('auth.canSignIn') });
      setIsSignUp(false);
      signUpForm.reset();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-muted">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Ban message */}
        {banMessage && (
          <Card className="mb-4 border-destructive">
            <CardContent className="py-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-destructive">Account Banned</p>
                <p className="text-sm text-muted-foreground mt-1">Reason: {banMessage}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {isSignUp ? (
          <Card className="border-2 border-accent/30 shadow-2xl bg-gradient-to-b from-accent/5 to-background">
            <CardHeader className="space-y-1 text-center pb-4">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                <UserPlus className="h-6 w-6" />
              </div>
              <CardTitle className="text-2xl font-bold">{t('auth.createAccount')}</CardTitle>
              <CardDescription>{t('auth.chooseUsername')}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="signup-username">{t('auth.username')}</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="signup-username" placeholder="username" className="pl-10" {...signUpForm.register('username')} />
                  </div>
                  {signUpForm.formState.errors.username && <p className="text-xs text-destructive">{signUpForm.formState.errors.username.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>First Name *</Label>
                    <Input placeholder="First name" {...signUpForm.register('firstName')} />
                    {signUpForm.formState.errors.firstName && <p className="text-xs text-destructive">{signUpForm.formState.errors.firstName.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label>Last Name *</Label>
                    <Input placeholder="Last name" {...signUpForm.register('lastName')} />
                    {signUpForm.formState.errors.lastName && <p className="text-xs text-destructive">{signUpForm.formState.errors.lastName.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Father's Name *</Label>
                    <Input placeholder="Father's name" {...signUpForm.register('fathersName')} />
                    {signUpForm.formState.errors.fathersName && <p className="text-xs text-destructive">{signUpForm.formState.errors.fathersName.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label>Age *</Label>
                    <Input type="number" min={5} max={100} placeholder="Age" {...signUpForm.register('age')} />
                    {signUpForm.formState.errors.age && <p className="text-xs text-destructive">{signUpForm.formState.errors.age.message}</p>}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>School *</Label>
                  <Input placeholder="School name" {...signUpForm.register('school')} />
                  {signUpForm.formState.errors.school && <p className="text-xs text-destructive">{signUpForm.formState.errors.school.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="signup-phone">{t('auth.phoneOrEmail')}</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="signup-phone" placeholder="+998 XX XXX XX XX" className="pl-10" {...signUpForm.register('phone')} />
                  </div>
                  {signUpForm.formState.errors.phone && <p className="text-xs text-destructive">{signUpForm.formState.errors.phone.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="signup-password">{t('auth.password')}</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="signup-password" type="password" placeholder="••••••••" className="pl-10" {...signUpForm.register('password')} />
                  </div>
                  {signUpForm.formState.errors.password && <p className="text-xs text-destructive">{signUpForm.formState.errors.password.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="signup-confirm">{t('auth.confirmPassword')}</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="signup-confirm" type="password" placeholder="••••••••" className="pl-10" {...signUpForm.register('confirmPassword')} />
                  </div>
                  {signUpForm.formState.errors.confirmPassword && <p className="text-xs text-destructive">{signUpForm.formState.errors.confirmPassword.message}</p>}
                </div>

                <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isLoading}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>{t('auth.createAccountBtn')}<ArrowRight className="ml-2 h-4 w-4" /></>}
                </Button>
              </form>

              <div className="mt-4 text-center text-sm">
                <p className="text-muted-foreground">
                  {t('auth.alreadyHaveAccount')}{' '}
                  <button type="button" onClick={() => setIsSignUp(false)} className="text-primary font-medium hover:underline">
                    {t('nav.signIn')}
                  </button>
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-0 shadow-2xl">
            <CardHeader className="space-y-1 text-center pb-8">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary">
                <LogIn className="h-7 w-7 text-primary-foreground" />
              </div>
              <CardTitle className="text-2xl font-bold">{t('auth.welcomeBack')}</CardTitle>
              <CardDescription>{t('auth.signInWith')}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={signInForm.handleSubmit(handleSignIn)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-username">{t('auth.username')}</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="signin-username" placeholder="username" className="pl-10" {...signInForm.register('username')} />
                  </div>
                  {signInForm.formState.errors.username && <p className="text-sm text-destructive">{signInForm.formState.errors.username.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">{t('auth.password')}</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="signin-password" type="password" placeholder="••••••••" className="pl-10" {...signInForm.register('password')} />
                  </div>
                  {signInForm.formState.errors.password && <p className="text-sm text-destructive">{signInForm.formState.errors.password.message}</p>}
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>{t('auth.signInBtn')}<ArrowRight className="ml-2 h-4 w-4" /></>}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm">
                <p className="text-muted-foreground">
                  {t('auth.dontHaveAccount')}{' '}
                  <button type="button" onClick={() => setIsSignUp(true)} className="text-accent font-medium hover:underline">
                    {t('auth.signUp')}
                  </button>
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  );
}
