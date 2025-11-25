import { forwardRef, memo } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

type TableProps = React.TableHTMLAttributes<HTMLTableElement> & VariantProps<typeof tableVariants>;

const tableVariants = cva(
    'w-full caption-bottom text-sm',
    {
        variants: {
            variant: {
                default: '',
                striped: '[&>tbody>tr:nth-child(even)]:bg-muted/50',
                bordered: 'border border-border',
            },
            size: {
                default: '',
                sm: 'text-xs',
                lg: 'text-base',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    }
);

const Table = memo(forwardRef<HTMLTableElement, React.TableHTMLAttributes<HTMLTableElement> & VariantProps<typeof tableVariants>>(
    ({ className, variant, size, ...props }, ref) => (
        <div className="relative w-full overflow-auto">
            <table
                ref={ref}
                className={cn(tableVariants({ variant, size }), className)}
                {...props}
            />
        </div>
    )
));
Table.displayName = 'MemoizedTable';

const TableHeader = memo(forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
    ({ className, ...props }, ref) => (
        <thead ref={ref} className={cn('[&_tr]:border-b', className)} {...props} />
    )
));
TableHeader.displayName = 'MemoizedTableHeader';

const TableBody = memo(forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
    ({ className, ...props }, ref) => (
        <tbody
            ref={ref}
            className={cn('[&_tr:last-child]:border-0', className)}
            {...props}
        />
    )
));
TableBody.displayName = 'MemoizedTableBody';

const TableFooter = memo(forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
    ({ className, ...props }, ref) => (
        <tfoot
            ref={ref}
            className={cn(
                'border-t bg-muted/50 font-medium [&>tr]:last:border-b-0',
                className
            )}
            {...props}
        />
    )
));
TableFooter.displayName = 'MemoizedTableFooter';

const TableRow = memo(forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
    ({ className, ...props }, ref) => (
        <tr
            ref={ref}
            className={cn(
                'border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted',
                className
            )}
            {...props}
        />
    )
));
TableRow.displayName = 'MemoizedTableRow';

const TableHead = memo(forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(
    ({ className, ...props }, ref) => (
        <th
            ref={ref}
            className={cn(
                'h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0',
                className
            )}
            {...props}
        />
    )
));
TableHead.displayName = 'MemoizedTableHead';

const TableCell = memo(forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(
    ({ className, ...props }, ref) => (
        <td
            ref={ref}
            className={cn('p-4 align-middle [&:has([role=checkbox])]:pr-0', className)}
            {...props}
        />
    )
));
TableCell.displayName = 'MemoizedTableCell';

const TableCaption = memo(forwardRef<HTMLTableCaptionElement, React.HTMLAttributes<HTMLTableCaptionElement>>(
    ({ className, ...props }, ref) => (
        <caption
            ref={ref}
            className={cn('mt-4 text-sm text-muted-foreground', className)}
            {...props}
        />
    )
));
TableCaption.displayName = 'MemoizedTableCaption';

export {
    Table,
    TableHeader,
    TableBody,
    TableFooter,
    TableHead,
    TableRow,
    TableCell,
    TableCaption,
};
export type { TableProps };
