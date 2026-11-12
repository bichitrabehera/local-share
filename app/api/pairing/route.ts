export const runtime = "nodejs"

import {
  getPairingState,
  revokePairing,
  regeneratePairing,
  validatePairing,
} from "@/lib/auth"

export async function GET() {
  const state = getPairingState()
  const required = process.env.LOCALDROP_PAIRING_REQUIRED !== "false"
  return Response.json({
    required,
    token: state?.token || null,
    pin: state?.pin || null,
    expiresAt: state?.expiresAt || null,
    revoked: state?.revoked || false,
  })
}

export async function POST(req: Request) {
  const { action } = (await req.json()) as { action?: string }
  if (action === "revoke") {
    revokePairing()
    return Response.json({ ok: true })
  }
  if (action === "regenerate") {
    const expirationHours = process.env.LOCALDROP_PAIRING_EXPIRATION_HOURS
      ? Number(process.env.LOCALDROP_PAIRING_EXPIRATION_HOURS)
      : undefined
    const state = regeneratePairing({ expirationHours })
    return Response.json({
      token: state.token,
      pin: state.pin,
      expiresAt: state.expiresAt,
    })
  }
  return Response.json({ error: "invalid action" }, { status: 400 })
}

export async function DELETE() {
  revokePairing()
  return Response.json({ ok: true })
}