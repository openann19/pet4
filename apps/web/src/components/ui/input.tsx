import type { ComponentProps } from "react"

import { cn } from "@/lib/utils"
import { getTypographyClasses, getSpacingClassesFromConfig } from "@/lib/typography"

function Input({ className, type, ...props }: ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex w-full min-w-0 rounded-lg border border-gray-300 bg-background text-foreground shadow-sm transition-all duration-200 outline-none",
        getTypographyClasses('body'),
        getSpacingClassesFromConfig({ paddingX: 'md', paddingY: 'xs' }),
        "placeholder:text-muted-foreground placeholder:transition-opacity",
        "selection:bg-primary selection:text-primary-foreground",
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
        "focus:border-blue-500 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:placeholder:opacity-50 focus:shadow-md",
        "hover:border-gray-400 hover:shadow-md",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted/30",
        "aria-invalid:border-red-500 aria-invalid:ring-2 aria-invalid:ring-red-500/20 aria-invalid:animate-pulse",
        "read-only:bg-muted/20 read-only:cursor-default",
        className
      )}
      {...props}
    />
  )
}

export { Input }
