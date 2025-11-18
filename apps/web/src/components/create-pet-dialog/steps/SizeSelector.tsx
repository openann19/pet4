import { Label } from '@/components/ui/label';

interface SizeSelectorProps {
  size: 'small' | 'medium' | 'large' | 'extra-large';
  onSelect: (size: 'small' | 'medium' | 'large' | 'extra-large') => void;
}

export function SizeSelector({ size, onSelect }: SizeSelectorProps) {
  return (
    <div>
      <Label htmlFor="size" className="mb-3 block">
        Size *
      </Label>
      <select
        id="size"
        value={size}
        onChange={(e) => {
          const value = e.target.value as 'small' | 'medium' | 'large' | 'extra-large';
          if (['small', 'medium', 'large', 'extra-large'].includes(value)) {
            onSelect(value);
          }
        }}
        className="w-full px-4 py-3 border border-input rounded-lg bg-background hover:border-ring transition-colors text-lg"
      >
        <option value="small">Small</option>
        <option value="medium">Medium</option>
        <option value="large">Large</option>
        <option value="extra-large">Extra Large</option>
      </select>
    </div>
  );
}

