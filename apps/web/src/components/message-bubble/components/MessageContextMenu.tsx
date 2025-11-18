import { Smiley, ArrowUUpLeft, Copy, Flag, Trash } from '@phosphor-icons/react';
import { MotionView } from '@petspark/motion';
import { cn } from '@/lib/utils';
import type  from '@petspark/motion';
import { ContextMenuItem } from './ContextMenuItem';

interface MenuItemsProps {
  isOwn: boolean;
  onShowReactions: () => void;
  onReply?: () => void;
  onCopy?: () => void;
  onReport?: () => void;
  onDelete?: () => void;
  t: {
    chat?: {
      react?: string;
      reply?: string;
      copy?: string;
      report?: string;
      delete?: string;
    };
  };
}

function renderMenuItems(props: MenuItemsProps) {
  return (
    <>
      <ContextMenuItem
        icon={<Smiley size={16} />}
        label={props.t.chat?.react ?? 'React'}
        onClick={props.onShowReactions}
      />
      {props.onReply && (
        <ContextMenuItem
          icon={<ArrowUUpLeft size={16} />}
          label={props.t.chat?.reply ?? 'Reply'}
          onClick={props.onReply}
        />
      )}
      {props.onCopy && (
        <ContextMenuItem
          icon={<Copy size={16} />}
          label={props.t.chat?.copy ?? 'Copy'}
          onClick={props.onCopy}
        />
      )}
      {props.onReport && !props.isOwn && (
        <ContextMenuItem
          icon={<Flag size={16} />}
          label={props.t.chat?.report ?? 'Report'}
          onClick={props.onReport}
          variant="destructive"
        />
      )}
      {props.onDelete && (
        <ContextMenuItem
          icon={<Trash size={16} />}
          label={props.t.chat?.delete ?? 'Delete'}
          onClick={props.onDelete}
          variant="destructive"
        />
      )}
    </>
  );
}

interface MessageContextMenuProps {
  isOwn: boolean;
  contextMenuStyle: AnimatedStyle;
  onShowReactions: () => void;
  onReply?: () => void;
  onCopy?: () => void;
  onReport?: () => void;
  onDelete?: () => void;
  t: {
    chat?: {
      react?: string;
      reply?: string;
      copy?: string;
      report?: string;
      delete?: string;
    };
  };
}

export function MessageContextMenu({
  isOwn,
  contextMenuStyle,
  onShowReactions,
  onReply,
  onCopy,
  onReport,
  onDelete,
  t,
}: MessageContextMenuProps) {
  return (
    <MotionView
      style={contextMenuStyle}
      className={cn(
        'absolute z-50 bg-card border border-border rounded-lg shadow-lg p-1',
        'flex flex-col gap-1 min-w-40',
        isOwn ? 'right-0' : 'left-0'
      )}
      onClick={(e?: React.MouseEvent) => {
        if (e) {
          e.stopPropagation();
        }
      }}
    >
      {renderMenuItems({
        isOwn,
        onShowReactions,
        onReply,
        onCopy,
        onReport,
        onDelete,
        t,
      })}
    </MotionView>
  );
}

