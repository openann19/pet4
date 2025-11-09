import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useUIConfig } from "@/hooks/use-ui-config";

export function PetDetailSkeleton(): JSX.Element {
    const uiConfig = useUIConfig();
    return (
        <div className="space-y-6">
          {/* Photo Gallery Skeleton */}
          <div className="relative h-96 bg-muted rounded-lg">
            <Skeleton className="w-full h-full" />
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="w-2 h-2 rounded-full" />
              ))}
            </div>
          </div>

          {/* Header Skeleton */}
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-40" />
          </div>

          {/* Match Reasons Skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-5/6" />
            </CardContent>
          </Card>

          {/* Tabs Skeleton */}
          <div className="space-y-4">
            <div className="flex gap-4 border-b">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-24" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/5" />
            </div>
          </div>

          {/* Action Buttons Skeleton */}
          <div className="flex gap-3">
            <Skeleton className="h-12 flex-1 rounded-full" />
            <Skeleton className="h-12 flex-1 rounded-full" />
            <Skeleton className="h-12 flex-1 rounded-full" />
          </div>
        </div>
      );
}
