
import { getNetworkInfo } from "@/lib/network"

export async function GET() {
  const port = Number(process.env.LOCALDROP_PORT) || 3000
  const advertisedHost =
    process.env.LOCALDROP_ADVERTISED_HOST || undefined
  const info = getNetworkInfo(advertisedHost, port)
  return Response.json(info)
}