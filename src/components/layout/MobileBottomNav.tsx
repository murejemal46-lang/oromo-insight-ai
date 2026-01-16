import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Newspaper, Search, User, LayoutDashboard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';

const navItems = [
  { icon: Home, label: 'nav.home', path: '/' },
  { icon: Newspaper, label: 'nav.categories', path: '/category/politics' },
  { icon: Search, label: 'common.search', path: '/search' },
  { icon: LayoutDashboard, label: 'nav.dashboard', path: '/dashboard', requiresAuth: true },
  { icon: User, label: 'nav.profile', path: '/auth', authPath: '/profile' },
];

// Haptic feedback utility
const triggerHaptic = (style: 'light' | 'medium' | 'heavy' = 'light') => {
  // Use Vibration API if available
  if ('vibrate' in navigator) {
    const patterns = {
      light: [10],
      medium: [20],
      heavy: [30],
    };
    navigator.vibrate(patterns[style]);
  }
};

export function MobileBottomNav() {
  const { t } = useTranslation();
  const location = useLocation();
  const { user } = useAuthStore();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const handleNavClick = () => {
    triggerHaptic('light');
  };

  return (
    <motion.nav 
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-background/95 backdrop-blur-lg border-t"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          // Skip dashboard for non-authenticated users
          if (item.requiresAuth && !user) return null;

          // Determine the correct path based on auth state
          const path = item.authPath && user ? item.authPath : item.path;
          const active = isActive(path);

          return (
            <Link
              key={item.label}
              to={path}
              onClick={handleNavClick}
              className={cn(
                'relative flex flex-col items-center justify-center gap-0.5 px-4 py-2 min-w-[64px]',
                'transition-colors duration-200',
                'active:scale-90 transition-transform',
                active
                  ? 'text-primary'
                  : 'text-muted-foreground'
              )}
            >
              {/* Background pill for active state */}
              <AnimatePresence>
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-x-2 inset-y-1 bg-primary/10 rounded-xl -z-10"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </AnimatePresence>

              {/* Icon with spring animation */}
              <motion.div
                animate={{
                  scale: active ? 1.15 : 1,
                  y: active ? -2 : 0,
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                whileTap={{ scale: 0.85 }}
              >
                <item.icon
                  className="w-5 h-5"
                  strokeWidth={active ? 2.5 : 1.75}
                />
              </motion.div>

              {/* Label with fade animation */}
              <motion.span 
                className="text-[10px] font-medium truncate"
                animate={{
                  opacity: active ? 1 : 0.7,
                  fontWeight: active ? 600 : 500,
                }}
                transition={{ duration: 0.2 }}
              >
                {t(item.label)}
              </motion.span>

              {/* Active indicator dot */}
              <AnimatePresence>
                {active && (
                  <motion.span
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-primary"
                  />
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </div>
    </motion.nav>
  );
}
