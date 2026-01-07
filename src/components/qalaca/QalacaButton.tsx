import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

export function QalacaButton() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-ai text-ai-foreground rounded-full shadow-elevated flex items-center justify-center hover:scale-105 transition-transform"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Sparkles className="w-6 h-6" />
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 z-50"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-background border-l shadow-modal z-50 flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b bg-ai-surface">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-ai" />
                  <span className="font-display font-semibold">{t('qalaca.name')}</span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <div className="flex-1 p-6 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <Sparkles className="w-12 h-12 mx-auto mb-4 text-ai" />
                  <p className="font-medium">{t('qalaca.tagline')}</p>
                  <p className="text-sm mt-2">{t('qalaca.disclaimer')}</p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
