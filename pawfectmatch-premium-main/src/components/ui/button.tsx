import type { ComponentProps } from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-300 disabled:pointer-events-none disabled:cursor-default [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-5 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-btn-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background aria-invalid:ring-destructive/30 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:bg-btn-hover-bg hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-0 active:shadow-md active:bg-btn-press-bg disabled:bg-btn-disabled-bg disabled:text-btn-disabled-fg disabled:shadow-none disabled:translate-y-0",
        destructive:
          "bg-destructive text-destructive-foreground shadow-lg hover:shadow-xl hover:bg-btn-destructive-hover-bg hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-0 active:shadow-md active:bg-btn-destructive-press-bg focus-visible:ring-destructive disabled:bg-btn-disabled-bg disabled:text-btn-disabled-fg disabled:shadow-none disabled:translate-y-0",
        outline:
          "border-[1.5px] border-input bg-transparent text-foreground shadow-sm hover:shadow-lg hover:bg-btn-outline-hover-bg hover:text-btn-outline-hover-fg hover:border-btn-outline-hover-bg hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-0 disabled:bg-transparent disabled:text-btn-disabled-fg disabled:border-btn-disabled-border disabled:shadow-none disabled:translate-y-0",
        secondary:
          "bg-secondary text-secondary-foreground shadow-lg hover:shadow-xl hover:bg-btn-secondary-hover-bg hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-0 active:shadow-md active:bg-btn-secondary-press-bg disabled:bg-btn-disabled-bg disabled:text-btn-disabled-fg disabled:shadow-none disabled:translate-y-0",
        ghost:
          "bg-transparent text-foreground hover:bg-btn-ghost-hover-bg hover:text-btn-ghost-hover-fg hover:shadow-sm active:scale-[0.98] disabled:bg-transparent disabled:text-btn-disabled-fg",
        link: "text-primary underline-offset-4 hover:underline hover:text-btn-link-hover-fg disabled:text-btn-disabled-fg disabled:no-underline",
      },
      size: {
        default: "h-11 px-4 py-2 has-[>svg]:px-3 [&_svg]:size-5",
        sm: "h-9 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5 [&_svg]:size-4",
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
