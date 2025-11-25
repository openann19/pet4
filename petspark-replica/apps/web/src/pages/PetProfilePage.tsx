import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PetAvatar } from '@/components/ui/Avatar';
import { Heart, MessageCircle, Share2, MapPin, Calendar } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { PetType, PetGender } from '@shared/types';
import { motion } from 'framer-motion';

// Mock pet data
const mockPet = {
  id: '1',
  name: 'Max',
  type: PetType.DOG,
  breed: 'Golden Retriever',
  age: 3,
  gender: PetGender.MALE,
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
    email: 'sarah@example.com',
    verified: false,
    premium: false,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
  },
  location: {
    latitude: 37.7749,
    longitude: -122.4194,
    city: 'San Francisco',
    country: 'United States',
  },
  createdAt: new Date('2023-01-15'),
  updatedAt: new Date('2023-01-15'),
  likeCount: 156,
  viewCount: 892,
};

export function PetProfilePage() {
  const { id: _id } = useParams<{ id: string }>();

  // In real app, this would fetch the pet data based on the id
  const pet = mockPet;

  return (
    <motion.div
      className="mx-auto max-w-4xl space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Pet Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        whileHover={{ scale: 1.01 }}
      >
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Pet Avatar */}
              <motion.div
                className="flex-shrink-0"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                whileHover={{ scale: 1.05 }}
              >
                <PetAvatar pet={pet} size="xl" />
              </motion.div>

              {/* Pet Info */}
              <div className="flex-1 space-y-4">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="flex items-center space-x-2">
                    <h1 className="text-3xl font-bold">{pet.name}</h1>
                    {pet.verified && (
                      <motion.div
                        className="h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center"
                        initial={{ rotate: 0 }}
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, delay: 0.5 }}
                      >
                        <span className="text-white text-xs">✓</span>
                      </motion.div>
                    )}
                  </div>
                  <p className="text-lg text-muted-foreground">
                    {pet.type} • {pet.breed} • {pet.age} years old • {pet.gender}
                  </p>
                </motion.div>

                <motion.div
                  className="flex items-center space-x-4 text-sm text-muted-foreground"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-4 w-4" />
                    <span>{pet.location.city}, {pet.location.country}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>Joined {pet.createdAt.toLocaleDateString()}</span>
                  </div>
                </motion.div>

                <motion.p
                  className="text-muted-foreground"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  {pet.description}
                </motion.p>

                <motion.div
                  className="flex flex-wrap gap-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  {pet.tags.map((tag, index) => (
                    <motion.span
                      key={tag}
                      className="rounded-full bg-primary/10 px-3 py-1 text-sm text-primary"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.7 + index * 0.1 }}
                      whileHover={{ scale: 1.1 }}
                    >
                      #{tag}
                    </motion.span>
                  ))}
                </motion.div>

                <motion.div
                  className="flex items-center space-x-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                >
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button className="flex items-center space-x-2">
                      <Heart className="h-4 w-4" />
                      <span>{pet.likeCount}</span>
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button variant="outline" className="flex items-center space-x-2">
                      <MessageCircle className="h-4 w-4" />
                      <span>Message</span>
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button variant="outline" className="flex items-center space-x-2">
                      <Share2 className="h-4 w-4" />
                      <span>Share</span>
                    </Button>
                  </motion.div>
                </motion.div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Owner Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        whileHover={{ scale: 1.01 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Owner</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  whileHover={{ scale: 1.1 }}
                >
                  <PetAvatar pet={pet} size="lg" />
                </motion.div>
                <div>
                  <h3 className="font-medium">{pet.owner.displayName}</h3>
                  <p className="text-sm text-muted-foreground">@{pet.owner.username}</p>
                </div>
              </div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button variant="outline">View Profile</Button>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Additional Details */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            whileHover={{ scale: 1.02 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Physical Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <motion.div
                  className="flex justify-between"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <span className="text-muted-foreground">Weight</span>
                  <span className="font-medium">{pet.weight} kg</span>
                </motion.div>
                <motion.div
                  className="flex justify-between"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  <span className="text-muted-foreground">Age</span>
                  <span className="font-medium">{pet.age} years</span>
                </motion.div>
                <motion.div
                  className="flex justify-between"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 }}
                >
                  <span className="text-muted-foreground">Gender</span>
                  <span className="font-medium">{pet.gender}</span>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            whileHover={{ scale: 1.02 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <motion.div
                  className="flex justify-between"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <span className="text-muted-foreground">Profile Views</span>
                  <span className="font-medium">{pet.viewCount.toLocaleString()}</span>
                </motion.div>
                <motion.div
                  className="flex justify-between"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  <span className="text-muted-foreground">Likes</span>
                  <span className="font-medium">{pet.likeCount.toLocaleString()}</span>
                </motion.div>
                <motion.div
                  className="flex justify-between"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 }}
                >
                  <span className="text-muted-foreground">Photos</span>
                  <span className="font-medium">24</span>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}
