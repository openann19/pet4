import type { ComponentProps } from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-300 disabled:pointer-events-none disabled:cursor-default [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-5 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background aria-invalid:ring-destructive/30 aria-invalid:border-destructive min-h-[44px] min-w-[44px]",           
  {
    variants: {
      variant: {
        default:
          "bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] shadow-lg hover:shadow-xl hover:bg-[var(--btn-primary-hover-bg)] hover:text-[var(--btn-primary-hover-fg)] hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-0 active:shadow-md active:bg-[var(--btn-primary-press-bg)] active:text-[var(--btn-primary-press-fg)] disabled:bg-[var(--btn-primary-disabled-bg)] disabled:text-[var(--btn-primary-disabled-fg)] disabled:shadow-none disabled:translate-y-0 focus-visible:ring-[var(--btn-primary-focus-ring)]",                   
        destructive:
          "bg-[var(--btn-destructive-bg)] text-[var(--btn-destructive-fg)] shadow-lg hover:shadow-xl hover:bg-[var(--btn-destructive-hover-bg)] hover:text-[var(--btn-destructive-hover-fg)] hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-0 active:shadow-md active:bg-[var(--btn-destructive-press-bg)] active:text-[var(--btn-destructive-press-fg)] focus-visible:ring-[var(--btn-destructive-focus-ring)] disabled:bg-[var(--btn-destructive-disabled-bg)] disabled:text-[var(--btn-destructive-disabled-fg)] disabled:shadow-none disabled:translate-y-0",                                    
        outline:
          "border-[1.5px] border-[var(--btn-outline-border)] bg-[var(--btn-outline-bg)] text-[var(--btn-outline-fg)] shadow-sm hover:shadow-lg hover:bg-[var(--btn-outline-hover-bg)] hover:text-[var(--btn-outline-hover-fg)] hover:border-[var(--btn-outline-hover-border)] hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-0 active:bg-[var(--btn-outline-press-bg)] active:text-[var(--btn-outline-press-fg)] active:border-[var(--btn-outline-press-border)] disabled:bg-[var(--btn-outline-disabled-bg)] disabled:text-[var(--btn-outline-disabled-fg)] disabled:border-[var(--btn-outline-disabled-border)] disabled:shadow-none disabled:translate-y-0 focus-visible:ring-[var(--btn-outline-focus-ring)]",         
        secondary:
          "bg-[var(--btn-secondary-bg)] text-[var(--btn-secondary-fg)] shadow-lg hover:shadow-xl hover:bg-[var(--btn-secondary-hover-bg)] hover:text-[var(--btn-secondary-hover-fg)] hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-0 active:shadow-md active:bg-[var(--btn-secondary-press-bg)] active:text-[var(--btn-secondary-press-fg)] disabled:bg-[var(--btn-secondary-disabled-bg)] disabled:text-[var(--btn-secondary-disabled-fg)] disabled:shadow-none disabled:translate-y-0 focus-visible:ring-[var(--btn-secondary-focus-ring)]",                                                                           
        ghost:
          "bg-[var(--btn-ghost-bg)] text-[var(--btn-ghost-fg)] hover:bg-[var(--btn-ghost-hover-bg)] hover:text-[var(--btn-ghost-hover-fg)] hover:shadow-sm active:scale-[0.98] active:bg-[var(--btn-ghost-press-bg)] active:text-[var(--btn-ghost-press-fg)] disabled:bg-[var(--btn-ghost-disabled-bg)] disabled:text-[var(--btn-ghost-disabled-fg)] focus-visible:ring-[var(--btn-ghost-focus-ring)]",                                                 
        link: "text-[var(--btn-link-fg)] underline-offset-4 hover:underline hover:text-[var(--btn-link-hover-fg)] disabled:text-[var(--btn-link-disabled-fg)] disabled:no-underline focus-visible:ring-[var(--btn-link-focus-ring)] bg-transparent",               
      },
      size: {
        default: "h-11 px-4 py-2 has-[>svg]:px-3 [&_svg]:size-5",
        sm: "h-9 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5 [&_svg]:size-4 min-h-[44px]",
        lg: "h-14 rounded-md px-6 has-[>svg]:px-4 text-base [&_svg]:size-6",
        icon: "size-11 min-w-[44px] min-h-[44px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
