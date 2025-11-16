import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SecretToggle } from './SecretToggle';

interface ConfigFieldProps {
  id: string;
  label: string;
  type?: 'text' | 'password' | 'number' | 'email' | 'tel' | 'url';
  value: string | number;
  onChange: (value: string | number) => void;
  placeholder?: string;
  showSecretToggle?: boolean;
  isSecretVisible?: boolean;
  onToggleSecret?: () => void;
  secretToggleAriaLabel?: string;
  step?: string;
  min?: string;
  max?: string;
}

export function ConfigField({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  showSecretToggle = false,
  isSecretVisible = false,
  onToggleSecret,
  secretToggleAriaLabel,
  step,
  min,
  max,
}: ConfigFieldProps) {
  const inputType = showSecretToggle && !isSecretVisible ? 'password' : type === 'password' ? 'password' : type;

  return (
    <div className="space-y-3">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            id={id}
            type={inputType}
            value={value}
            onChange={(e) => {
              if (type === 'number') {
                onChange(parseFloat(e.target.value) ?? 0);
              } else {
                onChange(e.target.value);
              }
            }}
            placeholder={placeholder}
            step={step}
            min={min}
            max={max}
          />
        </div>
        {showSecretToggle && onToggleSecret && (
          <SecretToggle
            isVisible={isSecretVisible}
            onToggle={onToggleSecret}
            ariaLabel={secretToggleAriaLabel ?? `Toggle ${label} visibility`}
          />
        )}
      </div>
    </div>
  );
}

