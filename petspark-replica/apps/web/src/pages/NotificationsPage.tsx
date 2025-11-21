import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Bell, Check, Heart, MessageCircle, User } from 'lucide-react';

export function NotificationsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Notifications</h1>
        <Button variant="outline" size="sm">
          Mark all as read
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <span>Recent</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start space-x-3 p-3 hover:bg-accent rounded-lg cursor-pointer">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Heart className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm"><strong>Sarah Johnson</strong> liked your post about Max</p>
              <p className="text-xs text-muted-foreground">5 minutes ago</p>
            </div>
            <div className="h-2 w-2 rounded-full bg-primary"></div>
          </div>
          
          <div className="flex items-start space-x-3 p-3 hover:bg-accent rounded-lg cursor-pointer">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <MessageCircle className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm"><strong>Mike Chen</strong> commented: "So cute! 🐕"</p>
              <p className="text-xs text-muted-foreground">1 hour ago</p>
            </div>
            <div className="h-2 w-2 rounded-full bg-primary"></div>
          </div>
          
          <div className="flex items-start space-x-3 p-3 hover:bg-accent rounded-lg cursor-pointer opacity-60">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm"><strong>Emma Wilson</strong> started following you</p>
              <p className="text-xs text-muted-foreground">2 hours ago</p>
            </div>
            <Check className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}