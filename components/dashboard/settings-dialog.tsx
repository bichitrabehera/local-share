"use client"

import { useCallback, useEffect, useState } from "react"
import { Copy, Check, AlertCircle, Loader2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { copyText } from "@/lib/utils"

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface PairingInfo {
  required: boolean
  token: string | null
  pin: string | null
  expiresAt: number | null
  revoked: boolean
}

function CopyButton({
  value,
  label,
}: {
  value: string | null
  label: string
}) {
  const [copied, setCopied] = useState(false)

  const copy = useCallback(async () => {
    if (!value) return
    const copiedOk = await copyText(value)
    if (!copiedOk) {
      toast({ title: "Could not copy to clipboard", variant: "destructive" })
      return
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [value])

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      onClick={copy}
      disabled={!value}
      className="h-7 w-7 shrink-0 p-0"
      aria-label={copied ? `${label} copied` : `Copy ${label}`}
      title={copied ? "Copied" : `Copy ${label}`}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-primary" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </Button>
  )
}

function SettingsBody() {
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [required, setRequired] = useState(true)
  const [active, setActive] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [pin, setPin] = useState<string | null>(null)
  const [expiresAt, setExpiresAt] = useState<number | null>(null)
  const [revoked, setRevoked] = useState(false)
  const [url, setUrl] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    Promise.all([
      fetch("/api/network").then((r) => r.json()),
      fetch("/api/pairing").then((r) => r.json()),
    ])
      .then(([network, pairing]: [{ advertisedUrl?: string }, PairingInfo]) => {
        if (cancelled) return
        setUrl(network.advertisedUrl || "")
        setRequired(pairing.required)
        setToken(pairing.token)
        setPin(pairing.pin)
        setExpiresAt(pairing.expiresAt)
        setRevoked(pairing.revoked)
        setActive(
          Boolean(pairing.token) &&
            !pairing.revoked &&
            !(pairing.expiresAt && Date.now() > pairing.expiresAt)
        )
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load settings")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const togglePairing = async (next: boolean) => {
    setBusy(true)
    try {
      const res = await fetch("/api/pairing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: next ? "regenerate" : "revoke" }),
      })
      if (!res.ok) throw new Error("Request failed")

      if (next) {
        const data = (await res.json()) as {
          token?: string
          pin?: string | null
          expiresAt?: number | null
        }
        setToken(data.token ?? null)
        setPin(data.pin ?? null)
        setExpiresAt(data.expiresAt ?? null)
        setRevoked(false)
        setActive(Boolean(data.token))
        toast({ title: "New pairing token generated" })
      } else {
        setRevoked(true)
        setActive(false)
        toast({ title: "Pairing token revoked" })
      }
    } catch {
      toast({ title: "Could not update pairing", variant: "destructive" })
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading settings…
      </div>
    )
  }

  return (
    <div className="space-y-5 py-2">
      {error && (
        <p className="flex items-center gap-2 text-xs text-red-400">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}

      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-foreground">
            Pairing token
          </h3>
          <p className="text-xs text-muted-foreground">
            When active, other devices need this token to upload or download
            files.
          </p>
        </div>
        <Switch
          checked={active}
          onCheckedChange={togglePairing}
          disabled={!required || busy}
          aria-label="Toggle pairing token"
        />
      </div>

      {!required && (
        <p className="flex flex-wrap items-center gap-1 rounded-md border border-border bg-background p-3 text-xs text-muted-foreground">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          Pairing is disabled by
          <code className="font-mono text-secondary-foreground">
            LOCALDROP_PAIRING_REQUIRED=false
          </code>
          .
        </p>
      )}

      {required && (
        <div className="space-y-2">
          <Label htmlFor="pairing-token">Current token</Label>
          <div className="flex items-center gap-2 rounded-md border border-border bg-background p-2">
            <code
              id="pairing-token"
              className="min-w-0 flex-1 break-all font-mono text-xs text-secondary-foreground"
            >
              {token || "No active token"}
            </code>
            <CopyButton value={token} label="pairing token" />
          </div>
          {pin && (
            <p className="text-xs text-muted-foreground">
              PIN required:{" "}
              <span className="font-mono text-secondary-foreground">{pin}</span>
            </p>
          )}
          {revoked && (
            <p className="flex items-center gap-1.5 text-xs text-red-400">
              <AlertCircle className="h-3.5 w-3.5" />
              This token is revoked. Generate a new one to pair devices.
            </p>
          )}
          {expiresAt && !revoked && (
            <p className="text-xs text-muted-foreground">
              Expires {new Date(expiresAt).toLocaleString()}
            </p>
          )}
        </div>
      )}

      <Separator />

      <div className="space-y-2">
        <Label htmlFor="server-url">Server URL</Label>
        <div className="flex items-center gap-2 rounded-md border border-border bg-background p-2">
          <code
            id="server-url"
            className="min-w-0 flex-1 break-all font-mono text-xs text-secondary-foreground"
          >
            {url || "Unavailable"}
          </code>
          <CopyButton value={url} label="server URL" />
        </div>
        <p className="text-xs text-muted-foreground">
          Used for the QR code and LAN sharing. Configure it with{" "}
          <code className="font-mono text-secondary-foreground">
            LOCALDROP_ADVERTISED_HOST
          </code>{" "}
          and{" "}
          <code className="font-mono text-secondary-foreground">
            LOCALDROP_PORT
          </code>
          .
        </p>
      </div>
    </div>
  )
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>Configure LocalDrop preferences</DialogDescription>
        </DialogHeader>

        <SettingsBody />

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
