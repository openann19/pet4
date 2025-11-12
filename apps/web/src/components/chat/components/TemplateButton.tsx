/**
 * Template Button Component
 *
 * Individual template button in the template panel
 */

import { Button } from '@/components/ui/button';
import { useHoverAnimation } from '@/effects/reanimated/use-hover-animation';
import { AnimatedView } from '@/effects/reanimated/animated-view';
import type { MessageTemplate } from '@/lib/chat-types';
import { useUIConfig } from "@/hooks/use-ui-config";

export interface TemplateButtonProps {
  template: MessageTemplate;
  onSelect: (template: MessageTemplate) => void;
}

export function TemplateButton({ template, onSelect }: TemplateButtonProps): JSX.Element {
    const _uiConfig = useUIConfig();
    const hover = useHoverAnimation({ scale: 1.02 });

  return (
    <AnimatedView style={hover.animatedStyle}>
      <Button
        variant="outline"
        className="w-full justify-start text-left h-auto py-2 px-3"
        onClick={() => { onSelect(template); }}
        onMouseEnter={hover.handleMouseEnter}
        onMouseLeave={hover.handleMouseLeave}
      >
        <div className="flex flex-col items-start gap-1">
          <span className="font-medium text-sm">{template.title}</span>
          <span className="text-xs text-muted-foreground">{template.text}</span>
        </div>
      </Button>
    </AnimatedView>
  );
}
