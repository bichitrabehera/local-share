"use client"

import * as React from "react"
import { AlertCircle, X } from "lucide-react"
import { cn } from "@/lib/utils"

export type ToastActionProps = {
  label?: string
  onClick?: () => void
}

export type ToastProps = {
  title?: string
  description?: string
  action?: ToastActionProps
  variant?: "default" | "destructive"
  onClose?: () => void
  className?: string
}

export function Toast({
  title,
  description,
  action,
  variant = "default",
  onClose,
  className,
}: ToastProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "pointer-events-auto flex w-full items-start gap-3 rounded-xl border border-border bg-card p-4 shadow-lg",
        variant === "destructive" && "border-red-600/60",
        className
      )}
    >
      {variant === "destructive" && (
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
      )}
      <div className="flex-1 space-y-1">
        {title && (
          <p className="text-sm font-semibold text-foreground">{title}</p>
        )}
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
        {action?.label && (
          <button
            type="button"
            onClick={action.onClick}
            className="mt-2 inline-flex h-8 items-center justify-center rounded-md border border-border bg-secondary px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-accent"
          >
            {action.label}
          </button>
        )}
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss notification"
          className="shrink-0 rounded-sm text-muted-foreground opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
