'use client';

import { AnimatedView } from '@/effects/reanimated/animated-view';
import { useEntryAnimation } from '@/effects/reanimated/use-entry-animation';
import { Button } from '@/components/ui/button';
import { MESSAGE_TEMPLATES } from '@/lib/chat-types';
import type { MessageTemplate } from '@/lib/chat-types';
import { X } from '@phosphor-icons/react';
import { useHoverAnimation } from '@/effects/reanimated/use-hover-animation';
import { useUIConfig } from "@/hooks/use-ui-config";

export interface TemplatePanelProps {
  onClose: () => void;
  onSelect: (t: MessageTemplate) => void;
}

export function TemplatePanel({ onClose, onSelect }: TemplatePanelProps): JSX.Element {
  const _uiConfig = useUIConfig();
  const animation = useEntryAnimation({ initialY: -10, delay: 0 });

  return (
    <AnimatedView style={animation.animatedStyle} className="glass-effect p-3 rounded-xl space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">Message Templates</h4>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onClose}
          aria-label="Close message templates"
        >
          <X size={14} />
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {MESSAGE_TEMPLATES.slice(0, 4).map((template) => (
          <TemplateButton key={template.id} template={template} onSelect={onSelect} />
        ))}
      </div>
    </AnimatedView>
  );
}

interface TemplateButtonProps {
  template: MessageTemplate;
  onSelect: (t: MessageTemplate) => void;
}

function TemplateButton({ template, onSelect }: TemplateButtonProps): JSX.Element {
  const hover = useHoverAnimation({ scale: 1.02 });

  return (
    <AnimatedView
      style={hover.animatedStyle}
      onMouseEnter={hover.handleMouseEnter}
      onMouseLeave={hover.handleMouseLeave}
      onMouseDown={hover.handleMouseDown}
      onMouseUp={hover.handleMouseUp}
      onClick={() => {
        onSelect(template);
      }}
      className="text-left p-2 rounded-lg glass-effect hover:bg-white/20 transition-colors cursor-pointer"
    >
      <div className="flex items-center gap-2 mb-1">
        <span>{template.icon}</span>
        <span className="text-xs font-semibold">{template.title}</span>
      </div>
      <p className="text-xs text-muted-foreground line-clamp-2">{template.content}</p>
    </AnimatedView>
  );
}
