"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

const badgeVariants = {
  default: "border-transparent text-foreground bg-secondary hover:bg-secondary",
  secondary:
    "border-transparent text-foreground bg-accent hover:bg-accent",
  destructive:
    "border-transparent text-foreground bg-destructive hover:opacity-90",
  outline:
    "border border-border text-foreground bg-background",
} as const

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement> {
  variant?: keyof typeof badgeVariants
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        badgeVariants[variant ?? "default"],
        className
      )}
      {...props}
    />
  )
)
Badge.displayName = "Badge"

export { Badge }
