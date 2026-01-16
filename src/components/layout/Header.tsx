import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Search, Globe, LayoutDashboard, User, LogOut, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguageStore } from '@/store/useLanguageStore';
import { useAuthStore } from '@/store/useAuthStore';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const categories = [
  'politics',
  'business',
  'culture',
  'sports',
  'technology',
  'health',
  'education',
  'world',
] as const;

export function Header() {
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguageStore();
  const { user } = useAuthStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: t('auth.logoutSuccess'),
      });
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'om' ? 'en' : 'om');
  };

  return (
    <header className="sticky top-0 z-50 glass border-b">
      {/* Top Bar */}
      <div className="bg-primary text-primary-foreground">
        <div className="container flex items-center justify-between h-8 text-xs">
          <span className="hidden sm:block">
            {new Date().toLocaleDateString(language === 'om' ? 'om-ET' : 'en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </span>
          <div className="flex items-center gap-4 ml-auto">
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 hover:text-accent transition-colors"
            >
              <Globe className="w-3.5 h-3.5" />
              <span className="font-medium uppercase">{language}</span>
            </button>
            {!user && (
              <div className="flex items-center gap-3">
                <Link to="/auth" className="hover:text-accent transition-colors">
                  {t('nav.login')}
                </Link>
                <Link to="/auth?mode=signup" className="hover:text-accent transition-colors">
                  {t('nav.signup')}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="container py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
              <span className="font-display font-bold text-accent-foreground text-xl">O</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="font-display text-2xl font-bold text-primary leading-none">
                OROMO TIMES
              </h1>
              <p className="text-xs text-muted-foreground leading-none mt-0.5">
                {t('home.aiPowered')}
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            <Link to="/">
              <Button variant="ghost" size="sm">
                {t('nav.home')}
              </Button>
            </Link>
            {categories.map((category) => (
              <Link key={category} to={`/category/${category}`}>
                <Button variant="ghost" size="sm">
                  {t(`nav.${category}`)}
                </Button>
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <Link to="/search">
              <Button variant="ghost" size="icon">
                <Search className="w-5 h-5" />
              </Button>
            </Link>
            {user && <NotificationBell />}
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-1 ml-1">
                    <div className="w-7 h-7 bg-accent/20 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-accent" />
                    </div>
                    <ChevronDown className="w-3 h-3 hidden sm:block" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard" className="flex items-center gap-2 cursor-pointer">
                      <LayoutDashboard className="w-4 h-4" />
                      {t('nav.dashboard')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center gap-2 cursor-pointer">
                      <User className="w-4 h-4" />
                      {t('nav.profile')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 cursor-pointer text-destructive">
                    <LogOut className="w-4 h-4" />
                    {t('nav.logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="lg:hidden border-t overflow-hidden bg-background"
          >
            <nav className="container py-4 flex flex-col gap-1">
              <Link to="/" onClick={() => setIsMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start">
                  {t('nav.home')}
                </Button>
              </Link>
              {categories.map((category) => (
                <Link
                  key={category}
                  to={`/category/${category}`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Button variant="ghost" className="w-full justify-start">
                    {t(`nav.${category}`)}
                  </Button>
                </Link>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
