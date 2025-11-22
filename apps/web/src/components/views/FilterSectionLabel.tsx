import { memo } from 'react';
import { Typography } from '@/core/tokens/typography';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface FilterSectionLabelProps {
    readonly children: React.ReactNode;
    readonly variant?: 'primary' | 'sub';
    readonly className?: string;
}

// Accessible label wrapper applying consistent typography tokens.
export const FilterSectionLabel = memo(({ children, variant = 'primary', className }: FilterSectionLabelProps): JSX.Element => {
    const scale = Typography.scale.h3; // use h3 for section headings (below sheet title h2)
    return (
        <Label
            className={cn('block', className, variant === 'sub' ? 'text-muted-foreground' : undefined)}
            style={{
                fontSize: scale.fontSize,
                lineHeight: scale.lineHeight,
                letterSpacing: scale.letterSpacing,
                fontWeight: scale.fontWeight,
                opacity: variant === 'sub' ? 0.85 : 1,
            }}
        >
            {children}
        </Label>
    );
});

FilterSectionLabel.displayName = 'FilterSectionLabel';
