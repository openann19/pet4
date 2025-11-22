import { Button } from '@/components/ui/button';
import { Eye, EyeSlash } from '@phosphor-icons/react';

interface SecretToggleProps {
  isVisible: boolean;
  onToggle: () => void;
  ariaLabel: string;
}

export function SecretToggle({ isVisible, onToggle, ariaLabel }: SecretToggleProps) {
  return (
    <Button variant="outline" size="sm" isIconOnly onClick={onToggle} aria-label={ariaLabel} className="w-10 h-10 p-0">
      {isVisible ? <EyeSlash size={20} /> : <Eye size={20} />}
    </Button>
  );
}

