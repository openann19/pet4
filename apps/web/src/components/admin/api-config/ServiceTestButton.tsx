import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { TestTube } from '@phosphor-icons/react';

interface ServiceTestButtonProps {
  serviceName: string;
  isTesting: boolean;
  onTest: () => void;
  disabled?: boolean;
}

export function ServiceTestButton({ serviceName, isTesting, onTest, disabled }: ServiceTestButtonProps) {
  return (
    <Button onClick={onTest} disabled={isTesting || disabled} className="flex-1">
      <TestTube size={20} className="mr-2" />
      {isTesting ? 'Testing...' : 'Test Connection'}
    </Button>
  );
}

