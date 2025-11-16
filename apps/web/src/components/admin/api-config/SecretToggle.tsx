import { Button } from '@/components/ui/button';
import { Eye, EyeSlash } from '@phosphor-icons/react';

interface SecretToggleProps {
  isVisible: boolean;
  onToggle: () => void;
  ariaLabel: string;
}

export function SecretToggle({ isVisible, onToggle, ariaLabel }: SecretToggleProps) {
  return (
    <Button variant="outline" size="icon" onClick={onToggle} aria-label={ariaLabel}>
      {isVisible ? <EyeSlash size={20} /> : <Eye size={20} />}
    </Button>
  );
}

