import { MotionView, useAnimatedStyle } from "@petspark/motion";
/**
 * Template Panel Component
 *
 * Message template selection panel
 */

import { X } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { useEntryAnimation } from '@/effects/reanimated/use-entry-animation';
import type { MessageTemplate } from '@/lib/chat-types';
import { MESSAGE_TEMPLATES } from '@/lib/chat-types';
import { TemplateButton } from './TemplateButton';
import { useUIConfig } from "@/hooks/use-ui-config";

export interface TemplatePanelProps {
  onClose: () => void;
  onSelect: (template: MessageTemplate) => void;
}

export function TemplatePanel({ onClose, onSelect }: TemplatePanelProps): JSX.Element {
    const _uiConfig = useUIConfig();
    const animation = useEntryAnimation({ initialY: 20, delay: 0 });

    const animatedStyle = useAnimatedStyle(() => ({
      opacity: animation.opacity.get(),
      transform: [
        { translateY: animation.translateY.get(), scale: animation.scale.get() },
      ],
    }));

  return (
    <MotionView
      style={animatedStyle}
      className="glass-strong border border-white/20 rounded-xl p-4 space-y-3 backdrop-blur-xl"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Message Templates</h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => void onClose()}
          className="h-6 w-6"
          aria-label="Close message templates"
        >
          <X size={16} />
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
        {MESSAGE_TEMPLATES.map((template) => (
          <TemplateButton key={template.id} template={template} onSelect={onSelect} />
        ))}
      </div>
    </MotionView>
  );
}
