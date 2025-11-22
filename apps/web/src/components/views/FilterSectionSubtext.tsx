import { memo } from 'react';
import { Typography } from '@/core/tokens/typography';
import { cn } from '@/lib/utils';

interface FilterSectionSubtextProps {
    readonly children: React.ReactNode;
    readonly className?: string;
    readonly tone?: 'muted' | 'default';
}

// Consistent body text helper for descriptive copy under section headings.
export const FilterSectionSubtext = memo(({ children, className, tone = 'muted' }: FilterSectionSubtextProps): JSX.Element => {
    const scale = Typography.scale.bodySmall;
    return (
        <p
            className={cn(
                'text-sm',
                tone === 'muted' ? 'text-muted-foreground' : 'text-foreground',
                className,
            )}
            style={{
                fontSize: scale.fontSize,
                lineHeight: scale.lineHeight,
                letterSpacing: scale.letterSpacing,
                fontWeight: scale.fontWeight,
            }}
        >
            {children}
        </p>
    );
});

FilterSectionSubtext.displayName = 'FilterSectionSubtext';
