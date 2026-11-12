"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export const buttonVariants = {
  primary:
    "border border-primary bg-primary text-primary-foreground hover:border-primary-hover hover:bg-primary-hover",
  secondary:
    "border border-border bg-secondary text-secondary-foreground hover:bg-accent hover:text-foreground",
  outline:
    "border border-border bg-transparent text-foreground hover:bg-secondary",
  ghost:
    "border border-transparent bg-transparent text-muted-foreground hover:bg-secondary hover:text-foreground",
  destructive:
    "border border-destructive bg-destructive text-destructive-foreground hover:opacity-90",
} as const

export const buttonSizes = {
  sm: "h-8 px-3 text-xs gap-1.5",
  default: "h-9 px-4 text-sm gap-2",
  lg: "h-11 px-6 text-sm gap-2",
  icon: "h-9 w-9 p-0",
} as const

export type ButtonVariant = keyof typeof buttonVariants
export type ButtonSize = keyof typeof buttonSizes

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, children, variant = "primary", size = "default", type = "button", ...props },
    ref
  ) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50",
        buttonVariants[variant],
        buttonSizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
)
Button.displayName = "Button"

export { Button }
