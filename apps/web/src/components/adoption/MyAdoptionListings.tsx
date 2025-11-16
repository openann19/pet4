import { Card } from '@/components/ui/card';
import { getTypographyClasses } from '@/lib/typography';
import { Heart } from '@phosphor-icons/react';
import { MotionView } from '@petspark/motion';
import { cn } from '@/lib/utils';

interface MyAdoptionListingsProps {
  userId: string;
}

export function MyAdoptionListings({ userId: _userId }: MyAdoptionListingsProps) {                                                                              
  return (
    <MotionView
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 0.61, 0.36, 1] }}
      className="py-6"
    >
      <Card className="p-12 bg-background/60 backdrop-blur-md border-border/40 shadow-lg rounded-2xl">
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          <MotionView
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4, type: 'spring', stiffness: 200 }}
          >
            <Heart size={64} className="mb-4 text-muted-foreground/50" weight="thin" />
          </MotionView>
          <h3 className={getTypographyClasses('h2')}>No Listings Yet</h3>
          <p className={cn(getTypographyClasses('body'), 'text-muted-foreground max-w-md')}>
            Your adoption listings will appear here. Create your first listing to start finding a loving home for a pet.
          </p>
        </div>
      </Card>
    </MotionView>
  );
}
