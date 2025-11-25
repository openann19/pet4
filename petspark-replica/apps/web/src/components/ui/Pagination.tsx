import { forwardRef, memo } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { Button } from './Button';

const paginationVariants = cva(
    'flex items-center gap-1',
    {
        variants: {
            size: {
                default: '',
                sm: 'gap-0',
                lg: 'gap-2',
            },
        },
        defaultVariants: {
            size: 'default',
        },
    }
);

const paginationItemVariants = cva(
    'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
    {
        variants: {
            variant: {
                default: 'hover:bg-accent hover:text-accent-foreground',
                active: 'bg-primary text-primary-foreground hover:bg-primary/90',
                disabled: 'pointer-events-none opacity-50',
            },
            size: {
                default: 'h-10 w-10',
                sm: 'h-8 w-8 text-xs',
                lg: 'h-12 w-12 text-base',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    }
);

export interface PaginationProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof paginationVariants> {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    showEdges?: boolean;
    showFirstLast?: boolean;
    maxVisiblePages?: number;
}

const Pagination = memo(forwardRef<HTMLDivElement, PaginationProps>(
    ({
        className,
        size,
        currentPage,
        totalPages,
        onPageChange,
        showEdges = true,
        showFirstLast = true,
        maxVisiblePages = 5,
        ...props
    }, ref) => {
        const getVisiblePages = () => {
            const pages: number[] = [];
            const halfVisible = Math.floor(maxVisiblePages / 2);

            let start = Math.max(1, currentPage - halfVisible);
            const end = Math.min(totalPages, start + maxVisiblePages - 1);

            if (end - start < maxVisiblePages - 1) {
                start = Math.max(1, end - maxVisiblePages + 1);
            }

            for (let i = start; i <= end; i++) {
                pages.push(i);
            }

            return pages;
        };

        const visiblePages = getVisiblePages();
        const showLeftEllipsis = showEdges && (visiblePages[0] ?? 0) > 2;
        const showRightEllipsis = showEdges && (visiblePages[visiblePages.length - 1] ?? totalPages) < totalPages - 1;

        const handlePageChange = (page: number) => {
            if (page >= 1 && page <= totalPages && page !== currentPage) {
                onPageChange(page);
            }
        };

        return (
            <div
                ref={ref}
                className={cn(paginationVariants({ size }), className)}
                role="navigation"
                aria-label="Pagination navigation"
                {...props}
            >
                {showFirstLast && (
                    <Button
                        variant="outline"
                        size={size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'default'}
                        onClick={() => handlePageChange(1)}
                        disabled={currentPage === 1}
                        aria-label="Go to first page"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        <ChevronLeft className="h-4 w-4 -ml-2" />
                    </Button>
                )}

                <Button
                    variant="outline"
                    size={size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'default'}
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    aria-label="Go to previous page"
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>

                {showFirstLast && (visiblePages[0] ?? 0) > 1 && (
                    <Button
                        variant={1 === currentPage ? 'default' : 'outline'}
                        size={size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'default'}
                        onClick={() => handlePageChange(1)}
                        aria-label={`Go to page 1`}
                        aria-current={1 === currentPage ? 'page' : undefined}
                    >
                        1
                    </Button>
                )}

                {showLeftEllipsis && (
                    <div className={cn(paginationItemVariants({ variant: 'disabled', size }))}>
                        <MoreHorizontal className="h-4 w-4" />
                    </div>
                )}

                {visiblePages.map((page) => (
                    <Button
                        key={page}
                        variant={page === currentPage ? 'default' : 'outline'}
                        size={size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'default'}
                        onClick={() => handlePageChange(page)}
                        aria-label={`Go to page ${page}`}
                        aria-current={page === currentPage ? 'page' : undefined}
                    >
                        {page}
                    </Button>
                ))}

                {showRightEllipsis && (
                    <div className={cn(paginationItemVariants({ variant: 'disabled', size }))}>
                        <MoreHorizontal className="h-4 w-4" />
                    </div>
                )}

                {showFirstLast && (visiblePages[visiblePages.length - 1] ?? totalPages) < totalPages && (
                    <Button
                        variant={totalPages === currentPage ? 'default' : 'outline'}
                        size={size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'default'}
                        onClick={() => handlePageChange(totalPages)}
                        aria-label={`Go to page ${totalPages}`}
                        aria-current={totalPages === currentPage ? 'page' : undefined}
                    >
                        {totalPages}
                    </Button>
                )}

                <Button
                    variant="outline"
                    size={size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'default'}
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    aria-label="Go to next page"
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>

                {showFirstLast && (
                    <Button
                        variant="outline"
                        size={size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'default'}
                        onClick={() => handlePageChange(totalPages)}
                        disabled={currentPage === totalPages}
                        aria-label="Go to last page"
                    >
                        <ChevronRight className="h-4 w-4" />
                        <ChevronRight className="h-4 w-4 -ml-2" />
                    </Button>
                )}
            </div>
        );
    }
));

Pagination.displayName = 'MemoizedPagination';

export { Pagination, paginationVariants, paginationItemVariants };
