interface StickerMessageContentProps {
  content: string;
}

export function StickerMessageContent({ content }: StickerMessageContentProps) {
  return <div className="text-5xl p-2">{content}</div>;
}

