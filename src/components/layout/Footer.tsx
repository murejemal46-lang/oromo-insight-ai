import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sparkles } from 'lucide-react';

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

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                <span className="font-display font-bold text-accent-foreground text-xl">O</span>
              </div>
              <span className="font-display text-2xl font-bold">OROMO TIMES</span>
            </Link>
            <p className="text-primary-foreground/70 text-sm leading-relaxed mb-4">
              {t('footer.mission')}
            </p>
            <div className="flex items-center gap-2 text-sm text-accent">
              <Sparkles className="w-4 h-4" />
              <span>{t('home.aiPowered')}</span>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h3 className="font-display font-semibold text-lg mb-4">
              {t('home.categories')}
            </h3>
            <ul className="space-y-2">
              {categories.slice(0, 4).map((category) => (
                <li key={category}>
                  <Link
                    to={`/category/${category}`}
                    className="text-primary-foreground/70 hover:text-accent transition-colors text-sm"
                  >
                    {t(`nav.${category}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-display font-semibold text-lg mb-4">&nbsp;</h3>
            <ul className="space-y-2">
              {categories.slice(4).map((category) => (
                <li key={category}>
                  <Link
                    to={`/category/${category}`}
                    className="text-primary-foreground/70 hover:text-accent transition-colors text-sm"
                  >
                    {t(`nav.${category}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-display font-semibold text-lg mb-4">
              {t('footer.about')}
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/about"
                  className="text-primary-foreground/70 hover:text-accent transition-colors text-sm"
                >
                  {t('footer.about')}
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="text-primary-foreground/70 hover:text-accent transition-colors text-sm"
                >
                  {t('footer.contact')}
                </Link>
              </li>
              <li>
                <Link
                  to="/privacy"
                  className="text-primary-foreground/70 hover:text-accent transition-colors text-sm"
                >
                  {t('footer.privacy')}
                </Link>
              </li>
              <li>
                <Link
                  to="/terms"
                  className="text-primary-foreground/70 hover:text-accent transition-colors text-sm"
                >
                  {t('footer.terms')}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 pt-8 border-t border-primary-foreground/10">
          <p className="text-center text-primary-foreground/50 text-sm">
            {t('footer.copyright')}
          </p>
        </div>
      </div>
    </footer>
  );
}
