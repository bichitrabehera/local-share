"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArrowLeftRight, FolderOpen, LayoutDashboard, Settings, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface AppSidebarProps {
  open: boolean
  onClose: () => void
  onOpenSettings: () => void
}

const NAV_ITEMS = [
  { href: "/", label: "Transfer", icon: LayoutDashboard, exact: true },
  { href: "/files", label: "Files", icon: FolderOpen },
  { href: "/history", label: "History", icon: ArrowLeftRight },
]

interface NetworkInfo {
  advertisedUrl?: string
  connected?: boolean
}

export function AppSidebar({ open, onClose, onOpenSettings }: AppSidebarProps) {
  const pathname = usePathname()
  const [network, setNetwork] = useState<NetworkInfo | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch("/api/network")
      .then((r) => r.json())
      .then((data: NetworkInfo) => {
        if (!cancelled) setNetwork(data)
      })
      .catch(() => {
        if (!cancelled) setNetwork({ connected: false })
      })
    return () => {
      cancelled = true
    }
  }, [])

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href)

  return (
    <>
      <div
        aria-hidden="true"
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-40 bg-black/70 transition-opacity md:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-sidebar-border bg-sidebar transition-transform duration-200 ease-out md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 shrink-0 items-center gap-2 border-b border-sidebar-border px-4">
          <Link
            href="/"
            onClick={onClose}
            className="flex min-w-0 flex-1 items-center gap-2.5"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <ArrowLeftRight className="h-4 w-4" />
            </span>
            <span className="truncate text-sm font-semibold text-foreground">
              LocalDrop
            </span>
          </Link>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground md:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 p-3">
          <ul className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.href, item.exact)
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
                      active
                        ? "bg-secondary font-medium text-foreground"
                        : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "h-4 w-4 shrink-0",
                        active ? "text-primary" : "text-muted-foreground"
                      )}
                    />
                    <span className="truncate">{item.label}</span>
                  </Link>
                </li>
              )
            })}
          </ul>

          <button
            type="button"
            onClick={onOpenSettings}
            className="mt-4 flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
          >
            <Settings className="h-4 w-4 shrink-0" />
            Settings
          </button>
        </nav>

        <div className="shrink-0 space-y-2 border-t border-sidebar-border p-4">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "h-1.5 w-1.5 shrink-0 rounded-full",
                network?.connected ? "bg-emerald-500" : "bg-muted-foreground"
              )}
            />
            <span className="truncate text-xs text-muted-foreground">
              {network
                ? network.connected
                  ? "LAN connected"
                  : "LAN offline"
                : "Checking…"}
            </span>
          </div>
          <p
            className="truncate font-mono text-[11px] text-muted-foreground"
            title={network?.advertisedUrl}
          >
            {network?.advertisedUrl || "—"}
          </p>
          <p className="text-[11px] text-muted-foreground/70">v0.1.0</p>
        </div>
      </aside>
    </>
  )
}
