import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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

export function MobileBottomNav() {
  const { t } = useTranslation();
  const location = useLocation();
  const { user } = useAuthStore();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-background/95 backdrop-blur-lg border-t safe-area-pb">
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
              className={cn(
                'flex flex-col items-center justify-center gap-1 px-3 py-2 min-w-[64px] transition-colors',
                active
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <item.icon
                className={cn(
                  'w-5 h-5 transition-transform',
                  active && 'scale-110'
                )}
                strokeWidth={active ? 2.5 : 2}
              />
              <span className="text-[10px] font-medium truncate">
                {t(item.label)}
              </span>
              {active && (
                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
