import type { ComponentProps } from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-lg border border-gray-300 bg-background px-3 py-2 text-base text-foreground shadow-sm transition-all duration-200 outline-none",
        "placeholder:text-muted-foreground placeholder:transition-opacity",
        "selection:bg-primary selection:text-primary-foreground",
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

export { Textarea }
