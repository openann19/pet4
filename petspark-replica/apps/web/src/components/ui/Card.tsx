import { forwardRef, memo } from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outlined' | 'elevated';
}

const Card = memo(forwardRef<HTMLDivElement, CardProps>(({ className, variant = 'default', ...props }, ref) => {
  const variantStyles = {
    default: 'rounded-lg border bg-card text-card-foreground shadow-sm',
    outlined: 'rounded-lg border-2 border-border bg-card text-card-foreground',
    elevated: 'rounded-lg border bg-card text-card-foreground shadow-lg',
  };

  return (
    <div
      ref={ref}
      className={cn(variantStyles[variant], className)}
      role="article"
      {...props}
    />
  );
}));

Card.displayName = 'MemoizedCard';

const CardHeader = memo(forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <header
    ref={ref}
    className={cn('flex flex-col space-y-1.5 p-6', className)}
    {...props}
  />
)));

CardHeader.displayName = 'MemoizedCardHeader';

export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

const CardTitle = memo(forwardRef<HTMLHeadingElement, CardTitleProps>(({ className, as: Tag = 'h3', ...props }, ref) => (
  <Tag
    ref={ref}
    className={cn(
      'text-2xl font-semibold leading-none tracking-tight',
      className
    )}
    {...props}
  />
)));

CardTitle.displayName = 'MemoizedCardTitle';

const CardDescription = memo(forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
)));

CardDescription.displayName = 'MemoizedCardDescription';

const CardContent = memo(forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <section ref={ref} className={cn('p-6 pt-0', className)} {...props} />
)));

CardContent.displayName = 'MemoizedCardContent';

const CardFooter = memo(forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <footer
    ref={ref}
    className={cn('flex items-center p-6 pt-0', className)}
    {...props}
  />
)));

CardFooter.displayName = 'MemoizedCardFooter';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
