import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { UserAvatar } from '@/components/ui/Avatar';
import { Bell, Check, Heart, MessageCircle, User } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from '@petspark/motion';

export function NotificationsPage() {
  const [notifications, setNotifications] = useState([
    {
      id: '1',
      type: 'like',
      user: {
        id: '2',
        displayName: 'Sarah Johnson',
        username: 'sarahj',
        email: 'sarah@example.com',
        verified: false,
        premium: false,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01'),
      },
      message: 'liked your post about Max',
      time: '5 minutes ago',
      read: false,
    },
    {
      id: '2',
      type: 'comment',
      user: {
        id: '3',
        displayName: 'Mike Chen',
        username: 'mikec',
        email: 'mike@example.com',
        verified: false,
        premium: false,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01'),
      },
      message: 'commented: "So cute! 🐕"',
      time: '1 hour ago',
      read: false,
    },
    {
      id: '3',
      type: 'follow',
      user: {
        id: '4',
        displayName: 'Emma Wilson',
        username: 'emmaw',
        email: 'emma@example.com',
        verified: false,
        premium: false,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01'),
      },
      message: 'started following you',
      time: '2 hours ago',
      read: true,
    },
  ]);

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like': return <Heart className="h-5 w-5 text-primary" />;
      case 'comment': return <MessageCircle className="h-5 w-5 text-primary" />;
      case 'follow': return <User className="h-5 w-5 text-primary" />;
      default: return <Bell className="h-5 w-5 text-primary" />;
    }
  };

  return (
    <motion.div
      className="mx-auto max-w-2xl space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between">
        <motion.h1
          className="text-2xl font-bold"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          Notifications
        </motion.h1>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button variant="outline" size="sm" onClick={markAllAsRead}>
            Mark all as read
          </Button>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }}
              >
                <Bell className="h-5 w-5" />
              </motion.div>
              <span>Recent</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <AnimatePresence>
              {notifications.map((notification, index) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  whileHover={{ scale: 1.02, backgroundColor: 'hsl(var(--accent))' }}
                  className={`flex items-start space-x-3 p-3 rounded-lg cursor-pointer ${notification.read ? 'opacity-60' : ''
                    }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex-shrink-0">
                    {notification.type === 'like' || notification.type === 'comment' || notification.type === 'follow' ? (
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        {getNotificationIcon(notification.type)}
                      </div>
                    ) : (
                      <UserAvatar user={notification.user} size="sm" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <strong>{notification.user.displayName}</strong> {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground">{notification.time}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {!notification.read && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        className="h-2 w-2 rounded-full bg-primary"
                      />
                    )}
                    {notification.read && (
                      <Check className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
