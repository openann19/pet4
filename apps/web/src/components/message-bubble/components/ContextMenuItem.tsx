import type { ReactNode } from 'react';

interface ContextMenuItemProps {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'destructive';
}

export function ContextMenuItem({
  icon,
  label,
  onClick,
  variant = 'default',
}: ContextMenuItemProps) {
  return (
    <button
      onClick={() => void onClick()}
      className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm ${
        variant === 'destructive'
          ? 'hover:bg-destructive/10 text-destructive'
          : 'hover:bg-muted'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

