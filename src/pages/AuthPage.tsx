import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Sparkles, ArrowLeft, Loader2 } from 'lucide-react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/useAuthStore';
import { useLanguageStore } from '@/store/useLanguageStore';
import { toast } from '@/hooks/use-toast';

const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address').max(255),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100),
});

const signupSchema = loginSchema.extend({
  fullName: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
});

export default function AuthPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();
  const { language } = useLanguageStore();

  const [isSignup, setIsSignup] = useState(searchParams.get('mode') === 'signup');
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const validateForm = () => {
    try {
      if (isSignup) {
        signupSchema.parse(formData);
      } else {
        loginSchema.parse(formData);
      }
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      if (isSignup) {
        const { error } = await supabase.auth.signUp({
          email: formData.email.trim(),
          password: formData.password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: {
              full_name: formData.fullName.trim(),
              preferred_language: language,
            },
          },
        });

        if (error) {
          if (error.message.includes('already registered')) {
            toast({
              title: t('auth.emailTaken'),
              variant: 'destructive',
            });
          } else {
            throw error;
          }
        } else {
          toast({
            title: t('auth.signupSuccess'),
          });
          navigate('/dashboard');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email.trim(),
          password: formData.password,
        });

        if (error) {
          toast({
            title: t('auth.invalidCredentials'),
            variant: 'destructive',
          });
        } else {
          toast({
            title: t('auth.loginSuccess'),
          });
          navigate('/dashboard');
        }
      }
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary text-primary-foreground p-12 flex-col justify-between">
        <div>
          <Link to="/" className="flex items-center gap-2 mb-12">
            <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
              <span className="font-display font-bold text-accent-foreground text-xl">O</span>
            </div>
            <span className="font-display text-2xl font-bold">OROMO TIMES</span>
          </Link>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="font-display text-4xl font-bold mb-4">
              {language === 'om' ? 'Gaazexeessaa Ta\'i' : 'Become a Journalist'}
            </h1>
            <p className="text-lg text-primary-foreground/80 mb-8">
              {language === 'om' 
                ? 'QALACA AI waliin barruulee amanamaa barreessi fi hawaasa Oromoo addunyaa maratti beeksisi.'
                : 'Write trustworthy articles with QALACA AI and reach the global Oromo community.'}
            </p>
          </motion.div>
        </div>

        <div className="flex items-center gap-2 text-accent">
          <Sparkles className="w-5 h-5" />
          <span className="font-medium">{t('home.aiPowered')}</span>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md"
        >
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8">
            <ArrowLeft className="w-4 h-4" />
            {t('nav.home')}
          </Link>

          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
              <span className="font-display font-bold text-accent-foreground">O</span>
            </div>
            <span className="font-display text-xl font-bold">OROMO TIMES</span>
          </div>

          <h2 className="font-display text-3xl font-bold mb-2">
            {isSignup ? t('auth.signup') : t('auth.login')}
          </h2>
          <p className="text-muted-foreground mb-8">
            {isSignup 
              ? (language === 'om' ? 'Herreega haaraa uumi' : 'Create a new account')
              : (language === 'om' ? 'Herreega kee seeni' : 'Sign in to your account')}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <div className="space-y-2">
                <Label htmlFor="fullName">{t('auth.fullName')}</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder={language === 'om' ? 'Maqaa guutuu kee' : 'Your full name'}
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="pl-10"
                    maxLength={100}
                  />
                </div>
                {errors.fullName && (
                  <p className="text-sm text-destructive">{errors.fullName}</p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">{t('auth.email')}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="pl-10"
                  maxLength={255}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t('auth.password')}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="pl-10"
                  maxLength={100}
                />
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              {isSignup ? t('auth.signup') : t('auth.login')}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignup(!isSignup);
                setErrors({});
              }}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              {isSignup ? t('auth.hasAccount') : t('auth.noAccount')}{' '}
              <span className="text-accent font-medium">
                {isSignup ? t('auth.login') : t('auth.signup')}
              </span>
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
