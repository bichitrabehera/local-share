"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { Menu, Settings } from "lucide-react"
import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { SettingsDialog } from "@/components/dashboard/settings-dialog"
import { Button } from "@/components/ui/button"

const PAGE_META: Record<string, { title: string; description: string }> = {
  "/": {
    title: "Transfer",
    description: "Connect a device and send files over your local network.",
  },
  "/files": {
    title: "Files",
    description: "Everything stored on this device.",
  },
  "/history": {
    title: "History",
    description: "Every transfer that moved through LocalDrop.",
  },
  "/share": {
    title: "Send a file",
    description: "Upload from this device to LocalDrop.",
  },
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const meta = PAGE_META[pathname] ?? {
    title: "LocalDrop",
    description: "LAN file transfer",
  }

  useEffect(() => {
    if (!sidebarOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previous
    }
  }, [sidebarOpen])

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpenSettings={() => {
          setSidebarOpen(false)
          setSettingsOpen(true)
        }}
      />

      <div className="flex min-h-screen min-w-0 flex-col md:pl-60">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background px-4 sm:px-6">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground md:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold text-foreground">
              {meta.title}
            </h1>
            <p className="hidden truncate text-xs text-muted-foreground sm:block">
              {meta.description}
            </p>
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSettingsOpen(true)}
              aria-label="Settings"
            >
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Settings</span>
            </Button>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-5xl">{children}</div>
        </main>
      </div>

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  )
}
