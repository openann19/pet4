import { useState } from 'react';
import { motion, Presence, MotionView } from '@petspark/motion';
import { Check, MagnifyingGlass } from '@phosphor-icons/react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  TEMPLATE_CATEGORIES,
  getTemplatesByCategory,
  type AdvancedTemplate,
} from '@/lib/story-templates';
import { cn } from '@/lib/utils';

interface StoryTemplateSelectorProps {
  selectedTemplate: AdvancedTemplate;
  onSelectTemplate: (template: AdvancedTemplate) => void;
}

export default function StoryTemplateSelector({
  selectedTemplate,
  onSelectTemplate,
}: StoryTemplateSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTemplates = getTemplatesByCategory(selectedCategory).filter(
    (template) =>
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="relative">
          <MagnifyingGlass
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={18}
          />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); }}
            className="pl-10"
          />
        </div>

        <ScrollArea className="w-full">
          <div className="flex gap-2 pb-2">
            {TEMPLATE_CATEGORIES.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => { setSelectedCategory(category.id); }}
                className={cn(
                  'whitespace-nowrap',
                  selectedCategory === category.id && 'bg-linear-to-r from-primary to-accent'
                )}
              >
                <span className="mr-1.5">{category.icon}</span>
                {category.name}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>

      <ScrollArea className="h-80">
        <div className="grid grid-cols-3 gap-3 pr-4">
          <Presence mode="popLayout">
            {filteredTemplates.map((template, index) => (
              <MotionView
                key={template.id}
                role="button"
                tabIndex={0}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{
                  duration: 0.2,
                  delay: index * 0.03,
                }}
                onClick={() => { onSelectTemplate(template); }}
                className={cn(
                  'relative aspect-9/16 rounded-xl overflow-hidden border-2 transition-all duration-200',
                  selectedTemplate.id === template.id
                    ? 'border-primary ring-2 ring-primary/20'
                    : 'border-border hover:border-primary/50'
                )}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  background: template.backgroundGradient
                    ? `linear-gradient(135deg, ${template.backgroundGradient.join(', ')})`
                    : template.backgroundColor,
                }}
              >
                <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
                  <div className="text-center">
                    <p className="text-xs font-bold text-white drop-shadow-lg leading-tight mb-1">
                      {template.name}
                    </p>
                    <p className="text-[10px] text-white/80 drop-shadow-md">
                      {template.description}
                    </p>
                  </div>
                </div>

                {template.category !== 'Basic' && (
                  <Badge
                    variant="secondary"
                    className="absolute top-1 left-1 text-[9px] px-1.5 py-0 h-4"
                  >
                    {template.category}
                  </Badge>
                )}

                {selectedTemplate.id === template.id && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow-lg"
                  >
                    <Check size={12} weight="bold" className="text-white" />
                  </motion.div>
                )}

                {template.animationStyle && (
                  <div className="absolute bottom-1 right-1">
                    <Badge
                      variant="secondary"
                      className="text-[8px] px-1 py-0 h-3 bg-black/40 text-white border-0"
                    >
                      {template.animationStyle}
                    </Badge>
                  </div>
                )}
              </MotionView>
            ))}
          </Presence>
        </div>

        {filteredTemplates.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <p className="text-muted-foreground text-sm">No templates found</p>
            <p className="text-xs text-muted-foreground mt-1">Try a different search or category</p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
