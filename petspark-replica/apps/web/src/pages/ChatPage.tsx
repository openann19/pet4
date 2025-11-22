import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { MessageCircle, Send } from 'lucide-react';

export function ChatPage() {
  return (
    <div className="flex h-[calc(100vh-8rem)]">
      {/* Chat List */}
      <div className="w-80 border-r border-border">
        <Card className="h-full rounded-none border-0">
          <CardHeader>
            <CardTitle>Messages</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-1">
              <div className="p-3 hover:bg-accent cursor-pointer">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary">JD</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">John Doe</span>
                      <span className="text-xs text-muted-foreground">2m ago</span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">Hey! How's Max doing?</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        <Card className="flex-1 rounded-none border-0">
          <CardHeader className="border-b border-border">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary">JD</span>
              </div>
              <div>
                <CardTitle className="text-base">John Doe</CardTitle>
                <CardDescription className="text-xs">Active now</CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 p-4">
            <div className="space-y-4">
              <div className="flex justify-start">
                <div className="max-w-xs rounded-lg bg-muted p-3">
                  <p className="text-sm">Hey! How's Max doing?</p>
                  <span className="text-xs text-muted-foreground">2 minutes ago</span>
                </div>
              </div>
              
              <div className="flex justify-end">
                <div className="max-w-xs rounded-lg bg-primary text-primary-foreground p-3">
                  <p className="text-sm">He's doing great! We just came back from the park 🐕</p>
                  <span className="text-xs opacity-70">1 minute ago</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Message Input */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="Type a message..."
              className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <Button size="sm">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}