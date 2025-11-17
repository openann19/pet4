import { MotionView } from "@petspark/motion";
/**
 * Date Group Component
 *
 * Date separator for grouped messages
 */

import { Badge } from '@/components/ui/badge';
import { useEntryAnimation } from '@/effects/reanimated/use-entry-animation';
import { useUIConfig } from "@/hooks/use-ui-config";

export interface DateGroupProps {
  date: string;
  delay: number;
}

export function DateGroup({ date, delay }: DateGroupProps): JSX.Element {
    const _uiConfig = useUIConfig();
    const animation = useEntryAnimation({ initialY: -10, delay });

  return (
    <MotionView style={animation.animatedStyle} className="flex items-center justify-center my-4">
      <Badge variant="secondary" className="text-xs px-3 py-1">
        {date}
      </Badge>
    </MotionView>
  );
}
