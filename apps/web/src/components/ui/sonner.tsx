import { useTheme } from "next-themes"
import type { CSSProperties } from "react"
import type { ToasterProps } from "sonner";
import { Toaster as Sonner } from "sonner"

const Toaster = (props: ToasterProps) => {
  const { theme = "system" } = useTheme()

  // Build props object without undefined values to satisfy exactOptionalPropertyTypes
  const finalProps: Partial<ToasterProps> = {
    className: "toaster group",
    style: {
      "--normal-bg": "var(--popover)",
      "--normal-text": "var(--popover-foreground)",
      "--normal-border": "var(--border)",
    } as CSSProperties,
  }
  
  // Add theme (always set since we have a default)
  const themeValue: ToasterProps["theme"] = (theme === 'light' || theme === 'dark' || theme === 'system') ? theme : 'system'
  finalProps.theme = themeValue
  
  // Copy defined props from input
  for (const [key, value] of Object.entries(props)) {
    if (value !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (finalProps as any)[key] = value
    }
  }

  return <Sonner {...(finalProps as ToasterProps)} />
}

export { Toaster }

