import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PetAvatar } from '@/components/ui/Avatar';
import { Heart, MessageCircle, Share2, MapPin, Calendar } from 'lucide-react';
import { useParams } from 'react-router-dom';

// Mock pet data
const mockPet = {
  id: '1',
  name: 'Max',
  type: 'Dog',
  breed: 'Golden Retriever',
  age: 3,
  gender: 'Male',
  weight: 32.5,
  description: 'Max is a friendly and energetic Golden Retriever who loves playing fetch and swimming. He gets along great with other dogs and children!',
  images: [''],
  tags: ['friendly', 'energetic', 'good with kids'],
  verified: true,
  owner: {
    id: '1',
    displayName: 'Sarah Johnson',
    username: 'sarahj',
    avatar: '',
  },
  location: {
    city: 'San Francisco',
    country: 'United States',
  },
  createdAt: new Date('2023-01-15'),
  likeCount: 156,
  viewCount: 892,
};

export function PetProfilePage() {
  const { id } = useParams<{ id: string }>();
  
  // In real app, this would fetch the pet data based on the id
  const pet = mockPet;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Pet Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Pet Avatar */}
            <div className="flex-shrink-0">
              <PetAvatar pet={pet} size="2xl" />
            </div>
            
            {/* Pet Info */}
            <div className="flex-1 space-y-4">
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-3xl font-bold">{pet.name}</h1>
                  {pet.verified && (
                    <div className="h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </div>
                <p className="text-lg text-muted-foreground">
                  {pet.type} • {pet.breed} • {pet.age} years old • {pet.gender}
                </p>
              </div>
              
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <MapPin className="h-4 w-4" />
                  <span>{pet.location.city}, {pet.location.country}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>Joined {pet.createdAt.toLocaleDateString()}</span>
                </div>
              </div>
              
              <p className="text-muted-foreground">{pet.description}</p>
              
              <div className="flex flex-wrap gap-2">
                {pet.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-primary/10 px-3 py-1 text-sm text-primary"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
              
              <div className="flex items-center space-x-4">
                <Button className="flex items-center space-x-2">
                  <Heart className="h-4 w-4" />
                  <span>{pet.likeCount}</span>
                </Button>
                <Button variant="outline" className="flex items-center space-x-2">
                  <MessageCircle className="h-4 w-4" />
                  <span>Message</span>
                </Button>
                <Button variant="outline" className="flex items-center space-x-2">
                  <Share2 className="h-4 w-4" />
                  <span>Share</span>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Owner Info */}
      <Card>
        <CardHeader>
          <CardTitle>Owner</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <PetAvatar pet={pet} size="md" />
              <div>
                <h3 className="font-medium">{pet.owner.displayName}</h3>
                <p className="text-sm text-muted-foreground">@{pet.owner.username}</p>
              </div>
            </div>
            <Button variant="outline">View Profile</Button>
          </div>
        </CardContent>
      </Card>

      {/* Additional Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Physical Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Weight</span>
              <span className="font-medium">{pet.weight} kg</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Age</span>
              <span className="font-medium">{pet.age} years</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Gender</span>
              <span className="font-medium">{pet.gender}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Profile Views</span>
              <span className="font-medium">{pet.viewCount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Likes</span>
              <span className="font-medium">{pet.likeCount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Photos</span>
              <span className="font-medium">24</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}