import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { User, Bell, Shield, Palette, HelpCircle, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export function SettingsPage() {
  const { user, logout } = useAuth();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Profile Settings</span>
          </CardTitle>
          <CardDescription>Manage your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Display Name</label>
            <Input defaultValue={user?.displayName} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Username</label>
            <Input defaultValue={user?.username} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <Input defaultValue={user?.email} type="email" />
          </div>
          <Button>Save Changes</Button>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <span>Notifications</span>
          </CardTitle>
          <CardDescription>Control how you receive notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Push Notifications</p>
              <p className="text-sm text-muted-foreground">Receive notifications in your browser</p>
            </div>
            <input type="checkbox" defaultChecked className="h-4 w-4" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Email Notifications</p>
              <p className="text-sm text-muted-foreground">Receive notifications via email</p>
            </div>
            <input type="checkbox" defaultChecked className="h-4 w-4" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Message Notifications</p>
              <p className="text-sm text-muted-foreground">Get notified when someone messages you</p>
            </div>
            <input type="checkbox" defaultChecked className="h-4 w-4" />
          </div>
        </CardContent>
      </Card>

      {/* Privacy Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Privacy & Security</span>
          </CardTitle>
          <CardDescription>Manage your privacy preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Private Profile</p>
              <p className="text-sm text-muted-foreground">Only followers can see your posts</p>
            </div>
            <input type="checkbox" className="h-4 w-4" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Show Online Status</p>
              <p className="text-sm text-muted-foreground">Let others see when you're online</p>
            </div>
            <input type="checkbox" defaultChecked className="h-4 w-4" />
          </div>
          <Button variant="outline">Change Password</Button>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Palette className="h-5 w-5" />
            <span>Appearance</span>
          </CardTitle>
          <CardDescription>Customize your app experience</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Theme</label>
            <select className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
              <option>Light</option>
              <option>Dark</option>
              <option>System</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Other Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <HelpCircle className="h-5 w-5" />
            <span>Support</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button variant="outline" className="w-full justify-start">
            Help Center
          </Button>
          <Button variant="outline" className="w-full justify-start">
            Report a Problem
          </Button>
          <Button variant="outline" className="w-full justify-start">
            Terms of Service
          </Button>
          <Button variant="outline" className="w-full justify-start">
            Privacy Policy
          </Button>
        </CardContent>
      </Card>

      {/* Logout */}
      <Button variant="destructive" className="w-full" onClick={logout}>
        <LogOut className="h-4 w-4 mr-2" />
        Log Out
      </Button>
    </div>
  );
}