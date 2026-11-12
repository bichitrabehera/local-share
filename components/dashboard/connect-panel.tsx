"use client"

import { useEffect, useState } from "react"
import QRCode from "qrcode"
import { Check, Copy, QrCode, Wifi } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { copyText } from "@/lib/utils"

interface ConnectInfo {
  advertisedUrl?: string
  connected?: boolean
}

export function ConnectPanel() {
  const [info, setInfo] = useState<ConnectInfo | null>(null)
  const [qr, setQr] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch("/api/network")
      .then((r) => r.json())
      .then(async (data: ConnectInfo) => {
        if (cancelled) return
        setInfo(data)
        if (!data.advertisedUrl) return
        const dataUrl = await QRCode.toDataURL(data.advertisedUrl, {
          width: 240,
          margin: 1,
          color: { dark: "#0a0a0a", light: "#ffffff" },
        })
        if (!cancelled) setQr(dataUrl)
      })
      .catch(() => {
        if (!cancelled) setInfo({ connected: false })
      })
    return () => {
      cancelled = true
    }
  }, [])

  const url = info?.advertisedUrl || ""

  const copy = async () => {
    if (!url) return
    const copiedOk = await copyText(url)
    setCopied(copiedOk)
    if (copiedOk) window.setTimeout(() => setCopied(false), 1600)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <Wifi className="h-4 w-4 text-primary" />
          Connect a device
        </CardTitle>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              info?.connected ? "bg-emerald-500" : "bg-muted-foreground"
            }`}
          />
          {info ? (info.connected ? "On your network" : "No network") : "Checking…"}
        </span>
      </CardHeader>

      <CardContent className="flex flex-col gap-6 sm:flex-row sm:items-start">
        <div className="min-w-0 flex-1 space-y-3">
          <p className="text-sm text-muted-foreground">
            Open this address on your phone, or scan the code with your camera.
          </p>

          <div className="flex items-center gap-2 rounded-md border border-border bg-background p-1.5 pl-3">
            <code className="min-w-0 flex-1 truncate text-sm text-foreground">
              {url || "—"}
            </code>
            <Button
              size="sm"
              variant="secondary"
              onClick={copy}
              disabled={!url}
              aria-label="Copy address"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>

          <details className="group text-xs text-muted-foreground">
            <summary className="cursor-pointer select-none text-xs text-muted-foreground hover:text-foreground">
              Phone not connecting?
            </summary>
            <ul className="mt-2 list-disc space-y-1 pl-4 leading-5">
              <li>The phone and this computer must be on the same Wi-Fi.</li>
              <li>Allow Node.js through Windows Firewall when prompted.</li>
              <li>
                Guest networks often block device-to-device traffic. Try the computer&apos;s
                mobile hotspot instead.
              </li>
            </ul>
          </details>
        </div>

        <div className="flex shrink-0 items-center justify-center">
          {qr ? (
            // eslint-disable-next-line @next/next/no-img-element -- generated data URL
            <img
              src={qr}
              alt="QR code for this LocalDrop address"
              className="h-32 w-32 rounded-md border border-border bg-white p-1.5"
            />
          ) : (
            <div className="flex h-32 w-32 items-center justify-center rounded-md border border-dashed border-border text-muted-foreground">
              <QrCode className="h-6 w-6" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
