import os from "node:os"

export interface LanCandidate {
  interface: string
  address: string
}

export interface NetworkInfo {
  lanIp: string | null
  advertisedUrl: string
  port: number
  connected: boolean
  candidates: string[]
}

const VIRTUAL_INTERFACE =
  /(vethernet|hyper-v|vmware|virtualbox|vbox|wsl|docker|tailscale|zerotier|loopback|npcap|bluetooth|tun\d|tap\d|utun)/i

function scoreCandidate(candidate: LanCandidate): number {
  let score = 0
  if (/wi-?fi|wlan|wireless/i.test(candidate.interface)) score += 30
  if (/ethernet|eth\d|en\d/i.test(candidate.interface)) score += 20
  if (VIRTUAL_INTERFACE.test(candidate.interface)) score -= 100
  if (candidate.address.startsWith("169.254.")) score -= 200
  return score
}

export function getLanCandidates(): LanCandidate[] {
  const interfaces = os.networkInterfaces()
  const candidates: LanCandidate[] = []

  for (const name of Object.keys(interfaces)) {
    for (const addr of interfaces[name] || []) {
      if (addr.family !== "IPv4" || addr.internal) continue
      candidates.push({ interface: name, address: addr.address })
    }
  }

  return candidates.sort((a, b) => scoreCandidate(b) - scoreCandidate(a))
}

export function getLanIp(): string | null {
  return getLanCandidates()[0]?.address ?? null
}

export function getNetworkInfo(
  advertisedHost: string | undefined,
  port: number
): NetworkInfo {
  const candidates = getLanCandidates()
  const lanIp = advertisedHost ?? candidates[0]?.address ?? null
  const advertisedUrl = lanIp
    ? `http://${lanIp}:${port}`
    : `http://localhost:${port}`

  return {
    lanIp,
    advertisedUrl,
    port,
    connected: lanIp !== null,
    candidates: candidates.map((c) => c.address),
  }
}

export function isPrivateIP(ip: string): boolean {
  if (!ip) return false
  const parts = ip.split(".").map(Number)
  if (parts.length !== 4 || parts.some((p) => p < 0 || p > 255)) return false
  const [a, b] = parts
  if (a === 10) return true
  if (a === 172 && b >= 16 && b <= 31) return true
  if (a === 192 && b === 168) return true
  return false
}
