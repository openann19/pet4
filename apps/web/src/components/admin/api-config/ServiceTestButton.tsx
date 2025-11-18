import { Button } from '@/components/ui/button';
import { TestTube } from '@phosphor-icons/react';

interface ServiceTestButtonProps {
  isTesting: boolean;
  onTest: () => void;
  disabled?: boolean;
}

export function ServiceTestButton({ isTesting, onTest, disabled }: ServiceTestButtonProps) {
  return (
    <Button onClick={onTest} disabled={isTesting || disabled} className="flex-1">
      <TestTube size={20} className="mr-2" />
      {isTesting ? 'Testing...' : 'Test Connection'}
    </Button>
  );
}

