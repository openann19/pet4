"use client"

import type { ComponentProps } from "react"
import * as SwitchPrimitive from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"
import { getAriaButtonAttributes } from "@/lib/accessibility"

function Switch({
  className,
  ...props
}: ComponentProps<typeof SwitchPrimitive.Root>) {
  const switchAria = getAriaButtonAttributes({
    label: props['aria-label'] || 'Toggle switch',
    pressed: props['aria-checked'] === 'true' || props['data-state'] === 'checked',
    disabled: props.disabled,
  });

  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      role="switch"
      className={cn(
        "peer data-[state=checked]:bg-primary data-[state=checked]:shadow-md data-[state=unchecked]:bg-input focus-visible:border-ring focus-visible:ring-ring/50 dark:data-[state=unchecked]:bg-input/80 inline-flex h-[1.15rem] w-8 shrink-0 items-center rounded-full border border-transparent shadow-xs transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted/30",
        className
      )}
      {...switchAria}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "bg-background dark:data-[state=unchecked]:bg-foreground dark:data-[state=checked]:bg-primary-foreground pointer-events-none block size-4 rounded-full shadow-sm ring-0 transition-all duration-200 data-[state=checked]:translate-x-[calc(100%-2px)] data-[state=checked]:scale-110 data-[state=unchecked]:translate-x-0 data-[state=unchecked]:scale-100"
        )}
        aria-hidden="true"
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
