import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  FileText,
  UserCheck,
  UserX,
  MessageSquare,
  AtSign,
  AlertCircle,
  X,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useNotifications, Notification } from '@/hooks/useNotifications';
import { useLanguageStore } from '@/store/useLanguageStore';
import { cn } from '@/lib/utils';

const notificationIcons: Record<Notification['type'], typeof FileText> = {
  article_published: FileText,
  article_approved: Check,
  article_rejected: X,
  journalist_approved: UserCheck,
  journalist_rejected: UserX,
  new_comment: MessageSquare,
  mention: AtSign,
  system: AlertCircle,
};

const notificationColors: Record<Notification['type'], string> = {
  article_published: 'text-success bg-success/10',
  article_approved: 'text-success bg-success/10',
  article_rejected: 'text-destructive bg-destructive/10',
  journalist_approved: 'text-success bg-success/10',
  journalist_rejected: 'text-destructive bg-destructive/10',
  new_comment: 'text-primary bg-primary/10',
  mention: 'text-accent bg-accent/10',
  system: 'text-warning bg-warning/10',
};

export function NotificationBell() {
  const { t } = useTranslation();
  const { language } = useLanguageStore();
  const [open, setOpen] = useState(false);
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    isMarkingAllAsRead,
  } = useNotifications();

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    if (notification.link) {
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold bg-destructive text-destructive-foreground rounded-full px-1"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 md:w-96 p-0" align="end" sideOffset={8}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">
            {language === 'om' ? 'Beeksisa' : 'Notifications'}
          </h3>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs"
                onClick={() => markAllAsRead()}
                disabled={isMarkingAllAsRead}
              >
                {isMarkingAllAsRead ? (
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                ) : (
                  <CheckCheck className="w-3 h-3 mr-1" />
                )}
                {language === 'om' ? 'Hunda dubbisi' : 'Mark all read'}
              </Button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <Bell className="w-10 h-10 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                {language === 'om' 
                  ? 'Beeksisni hin jiru'
                  : 'No notifications yet'}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              <AnimatePresence initial={false}>
                {notifications.map((notification, index) => {
                  const Icon = notificationIcons[notification.type];
                  const colorClass = notificationColors[notification.type];

                  const content = (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.02 }}
                      className={cn(
                        'relative flex gap-3 p-4 hover:bg-muted/50 transition-colors cursor-pointer group',
                        !notification.read && 'bg-primary/5'
                      )}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      {/* Unread indicator */}
                      {!notification.read && (
                        <span className="absolute left-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary" />
                      )}

                      {/* Icon */}
                      <div className={cn('shrink-0 w-9 h-9 rounded-full flex items-center justify-center', colorClass)}>
                        <Icon className="w-4 h-4" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-tight mb-0.5">
                          {notification.title}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
                          {notification.message}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                        </Button>
                      </div>
                    </motion.div>
                  );

                  return notification.link ? (
                    <Link key={notification.id} to={notification.link} onClick={() => setOpen(false)}>
                      {content}
                    </Link>
                  ) : (
                    content
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {notifications.length > 0 && (
          <>
            <Separator />
            <div className="p-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs text-muted-foreground hover:text-destructive"
                onClick={() => clearAll()}
              >
                <Trash2 className="w-3 h-3 mr-1" />
                {language === 'om' ? 'Hunda haqi' : 'Clear all notifications'}
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
