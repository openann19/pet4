import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { UserAvatar } from '@/components/ui/Avatar';
import { Camera, MapPin, Calendar, Edit } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export function ProfilePage() {
  const { user } = useAuth();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <UserAvatar user={user!} size="xl" />
                <Button variant="outline" size="sm" className="absolute bottom-0 right-0 h-8 w-8 rounded-full p-0">
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
              <div>
                <h1 className="text-2xl font-bold">{user?.displayName}</h1>
                <p className="text-muted-foreground">@{user?.username}</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          </div>
          
          <div className="mt-6 flex items-center space-x-6 text-sm text-muted-foreground">
            <div className="flex items-center space-x-1">
              <Calendar className="h-4 w-4" />
              <span>Joined January 2024</span>
            </div>
            <div className="flex items-center space-x-1">
              <MapPin className="h-4 w-4" />
              <span>San Francisco, CA</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bio */}
      <Card>
        <CardHeader>
          <CardTitle>About</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Pet lover and proud parent of two amazing dogs. Love sharing our adventures and connecting with other pet enthusiasts! 🐕❤️
          </p>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">247</div>
            <div className="text-sm text-muted-foreground">Posts</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">1.2K</div>
            <div className="text-sm text-muted-foreground">Followers</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">892</div>
            <div className="text-sm text-muted-foreground">Following</div>
          </CardContent>
        </Card>
      </div>

      {/* My Pets */}
      <Card>
        <CardHeader>
          <CardTitle>My Pets</CardTitle>
          <CardDescription>Manage your pet profiles</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-dashed">
              <CardContent className="p-4 text-center">
                <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                  <span className="text-2xl">+</span>
                </div>
                <h3 className="font-medium">Add Pet</h3>
                <p className="text-sm text-muted-foreground">Create a profile for your pet</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}