"use client"

import * as React from "react"

type ToastAction = {
  label?: string
  onClick?: () => void
}

type Toast = {
  id: string
  title?: string
  description?: string
  action?: ToastAction
  variant?: "default" | "destructive"
  duration?: number
}

type ToastProps = Omit<Toast, "id"> & {
  duration?: number
}

const TOAST_LIMIT = 5
const TOAST_REMOVE_DELAY = 5000

type ToasterState = {
  toasts: Toast[]
}

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

const toastState: ToasterState = { toasts: [] }
let listeners: (() => void)[] = []
const timers = new Map<string, ReturnType<typeof setTimeout>>()

function notify() {
  listeners.forEach((fn) => fn())
}

function clearTimer(id: string) {
  const timer = timers.get(id)
  if (timer) {
    clearTimeout(timer)
    timers.delete(id)
  }
}

function removeToast(id: string) {
  clearTimer(id)
  toastState.toasts = toastState.toasts.filter((t) => t.id !== id)
  notify()
}

function scheduleRemoval(id: string, duration: number) {
  clearTimer(id)
  if (duration <= 0) return
  const timer = setTimeout(() => removeToast(id), duration)
  timers.set(id, timer)
}

export function toast({ ...props }: ToastProps) {
  const id = genId()
  const duration = props.duration ?? TOAST_REMOVE_DELAY
  const newToast: Toast = {
    id,
    ...props,
    duration,
  }

  toastState.toasts = [newToast, ...toastState.toasts].slice(0, TOAST_LIMIT)
  scheduleRemoval(id, duration)
  notify()

  return {
    id,
    dismiss: () => removeToast(id),
    update: (update: Partial<Toast>) => {
      toastState.toasts = toastState.toasts.map((t) =>
        t.id === id ? { ...t, ...update } : t
      )
      notify()
    },
  }
}

export function useToast() {
  const [state, setState] = React.useState<ToasterState>(toastState)

  React.useEffect(() => {
    const fn = () => setState({ toasts: [...toastState.toasts] })
    listeners.push(fn)
    return () => {
      listeners = listeners.filter((f) => f !== fn)
    }
  }, [])

  return {
    ...state,
    toast,
    dismiss: (id?: string) => {
      if (typeof id === "string") {
        removeToast(id)
        return
      }
      toastState.toasts.forEach((t) => clearTimer(t.id))
      toastState.toasts = []
      notify()
    },
  }
}
