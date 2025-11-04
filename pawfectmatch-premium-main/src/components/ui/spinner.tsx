import type { ComponentProps } from "react"
import { cn } from "@/lib/utils"

interface SpinnerProps extends ComponentProps<"div"> {
  size?: "sm" | "md" | "lg"
}

function Spinner({ className, size = "md", ...props }: SpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4 border-2",
    md: "h-8 w-8 border-2",
    lg: "h-12 w-12 border-3"
  }

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading"
      className={cn("inline-block", className)}
      {...props}
    >
      <div
        className={cn(
          "animate-spin rounded-full border-primary border-t-transparent",
          sizeClasses[size]
        )}
      />
      <span className="sr-only">Loading...</span>
    </div>
  )
}

export { Spinner }
