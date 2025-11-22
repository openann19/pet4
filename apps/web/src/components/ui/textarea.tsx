import type { ComponentProps } from "react"

import { cn } from "@/lib/utils"
import { getTypographyClasses, getSpacingClassesFromConfig } from "@/lib/typography"

function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-xl border border-border bg-card text-foreground shadow-sm transition-all duration-150 outline-none",
        getTypographyClasses('body'),
        getSpacingClassesFromConfig({ paddingX: 'md', paddingY: 'sm' }),
        "placeholder:text-muted-foreground placeholder:transition-opacity",
        "selection:bg-primary selection:text-primary-foreground",
        "focus:border-ring focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background focus:placeholder:opacity-60",
        "hover:border-muted-foreground/50",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-muted/30",
        "aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/30",
        "read-only:bg-muted/20 read-only:text-muted-foreground read-only:cursor-default",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
