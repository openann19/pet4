import { useState } from 'react';
import { useStorage } from '@/hooks/use-storage';
import { MotionView, useAnimatedStyle } from '@petspark/motion';
import { useEntryAnimation } from '@/effects/reanimated/use-entry-animation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  MagnifyingGlass,
  Image as ImageIcon,
  CheckCircle,
  XCircle,
  Eye,
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import type { Pet } from '@/lib/types';
import { ProgressiveImage } from '@/components/enhanced/ProgressiveImage';

export default function ContentView() {
  const [allPets] = useStorage<Pet[]>('all-pets', []);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'flagged'>('all');

  const handleReviewPet = (pet: Pet) => {
    setSelectedPet(pet);
    setDialogOpen(true);
  };

  const handleApprovePet = () => {
    toast.success('Pet profile approved');
    setDialogOpen(false);
  };

  const handleRemovePet = () => {
    toast.success('Pet profile removed');
    setDialogOpen(false);
  };

  const filteredPets = (allPets ?? []).filter((pet: Pet) => {
    const matchesSearch =
      pet.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pet.breed?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Content Moderation</h1>
        <p className="text-muted-foreground">Review and moderate pet profiles and photos</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <MagnifyingGlass
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={20}
          />
          <Input
            placeholder="Search pets by name or breed..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setSearchQuery(e.target.value); }}
            className="pl-10"
          />
        </div>
      </div>

      <Tabs
        value={filterStatus}
        onValueChange={(v: string) => setFilterStatus(v as 'all' | 'active' | 'flagged')}
      >
        <TabsList>
          <TabsTrigger value="all">All ({(allPets ?? []).length})</TabsTrigger>
          <TabsTrigger value="active">Active ({(allPets ?? []).length})</TabsTrigger>
          <TabsTrigger value="flagged">Flagged (0)</TabsTrigger>
        </TabsList>
      </Tabs>

      <ScrollArea className="h-150">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredPets.map((pet: Pet, index: number) => (
            <Card
              key={pet.id}
              className="overflow-hidden transition-shadow animate-in fade-in slide-in-from-bottom-4 duration-300 hover:shadow-lg"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="aspect-square relative bg-muted">
                {pet.photo ? (
                  <ProgressiveImage
                    src={pet.photo}
                    alt={pet.name}
                    className="h-full w-full object-cover"
                    aria-label={`Photo of ${pet.name}`}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <ImageIcon size={48} className="text-muted-foreground" aria-hidden="true" />
                  </div>
                )}
                <Badge className="absolute right-2 top-2" variant="secondary">
                  Active
                </Badge>
              </div>

              <CardContent className="p-4">
                <h3 className="truncate font-semibold">{pet.name}</h3>
                <p className="truncate text-sm text-muted-foreground">
                  {pet.breed} • {pet.age?.toString() ?? 'N/A'}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">Owner: {pet.ownerName}</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3 w-full"
                  onClick={() => handleReviewPet(pet)}
                >
                  <Eye size={16} className="mr-2" />
                  Review
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>

      {filteredPets.length === 0 && (
        <Card className="p-12">
          <div className="text-center space-y-3">
            <ImageIcon size={48} className="mx-auto text-muted-foreground" />
            <h3 className="text-lg font-semibold">No content found</h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery ? 'Try adjusting your search query' : 'No content to display'}
            </p>
          </div>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Pet Profile</DialogTitle>
            <DialogDescription>
              Review pet profile details and take moderation action
            </DialogDescription>
          </DialogHeader>

          {selectedPet && (
            <div className="space-y-4">
              <div className="aspect-video relative bg-muted rounded-lg overflow-hidden">
                {selectedPet.photo ? (
                  <ProgressiveImage
                    src={selectedPet.photo}
                    alt={selectedPet.name}
                    className="w-full h-full object-cover"
                    aria-label={`Photo of ${selectedPet.name}`}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon size={64} className="text-muted-foreground" />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <InfoItem label="Name" value={selectedPet.name} />
                <InfoItem label="Breed" value={selectedPet.breed} />
                <InfoItem label="Age" value={selectedPet.age?.toString() ?? 'N/A'} />
                <InfoItem label="Size" value={selectedPet.size} />
                <InfoItem label="Gender" value={selectedPet.gender} />
                <InfoItem label="Owner" value={selectedPet.ownerName} />
              </div>

              {selectedPet.bio && (
                <div>
                  <p className="text-sm font-medium mb-1">Bio:</p>
                  <p className="text-sm text-muted-foreground">{selectedPet.bio}</p>
                </div>
              )}

              {selectedPet.personality &&
                Array.isArray(selectedPet.personality) &&
                selectedPet.personality.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Personality Traits:</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedPet.personality.map((trait: string) => (
                        <Badge key={trait} variant="secondary">
                          {trait}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogOpen(false); }}>
              Close
            </Button>
            <Button variant="destructive" onClick={handleRemovePet}>
              <XCircle size={16} className="mr-2" />
              Remove Profile
            </Button>
            <Button onClick={handleApprovePet}>
              <CheckCircle size={16} className="mr-2" />
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface AnimatedPetCardProps {
  pet: Pet
  index: number
  onReview: (pet: Pet) => void
}

function AnimatedPetCard({ pet, index, onReview }: AnimatedPetCardProps) {
  const entry = useEntryAnimation({
    initialScale: 0.95,
    initialOpacity: 0,
    delay: index * 20
  })

  const entryStyle = useAnimatedStyle(() => {
    const scale = entry.scale.get();
    const translateY = entry.translateY.get();
    return {
      opacity: entry.opacity.get(),
      transform: [{ scale, translateY }] as Record<string, number>[],
    };
  });

  return (
    <MotionView style={entryStyle}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
        <div className="aspect-square relative bg-muted">
          {pet.photo ? (
            <img
              src={pet.photo}
              alt={pet.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon size={48} className="text-muted-foreground" />
            </div>
          )}
          <Badge className="absolute top-2 right-2" variant="secondary">
            Active
          </Badge>
        </div>
        <CardContent className="p-4">
          <h3 className="font-semibold truncate">{pet.name}</h3>
          <p className="text-sm text-muted-foreground truncate">
            {pet.breed} • {pet.age?.toString() ?? 'N/A'}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Owner: {pet.ownerName}
          </p>
          <Button
            size="sm"
            variant="outline"
            className="w-full mt-3"
            onClick={() => { onReview(pet); }}
          >
            <Eye size={16} className="mr-2" />
            Review
          </Button>
        </CardContent>
      </Card>
    </MotionView>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium capitalize">{value}</p>
    </div>
  );
}
