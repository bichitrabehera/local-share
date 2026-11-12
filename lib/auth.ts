import crypto from "node:crypto"

const PAIRING_SECRET =
  process.env.LOCALDROP_PAIRING_SECRET || crypto.randomBytes(32).toString("hex")

export interface PairingState {
  token: string
  pin: string | null
  createdAt: number
  expiresAt: number | null
  revoked: boolean
}

let pairingState: PairingState | null = null

export function generatePairingToken(): string {
  return crypto.randomBytes(24).toString("hex")
}

export function createPairingToken({
  expirationHours,
  pin,
}: {
  expirationHours?: number
  pin?: string
}): PairingState {
  const token = generatePairingToken()
  const now = Date.now()
  const expiresAt =
    expirationHours && expirationHours > 0
      ? now + expirationHours * 60 * 60 * 1000
      : null
  pairingState = {
    token,
    pin: pin ?? null,
    createdAt: now,
    expiresAt,
    revoked: false,
  }
  return pairingState
}

export function getPairingState(): PairingState | null {
  if (!pairingState) {
    pairingState = createPairingToken({
      expirationHours:
        process.env.LOCALDROP_PAIRING_EXPIRATION_HOURS
          ? Number(process.env.LOCALDROP_PAIRING_EXPIRATION_HOURS)
          : undefined,
      pin: process.env.LOCALDROP_PAIRING_PIN || undefined,
    })
  }
  return pairingState
}

export function revokePairing(): void {
  if (pairingState) {
    pairingState.revoked = true
  }
}

export function regeneratePairing({
  expirationHours,
  pin,
}: {
  expirationHours?: number
  pin?: string
}): PairingState {
  pairingState = null
  return createPairingToken({ expirationHours, pin })
}

export function validatePairing({
  token,
  pin,
}: {
  token?: string
  pin?: string
}): { valid: boolean; reason?: string } {
  const required = process.env.LOCALDROP_PAIRING_REQUIRED !== "false"
  if (!required) return { valid: true }

  const state = getPairingState()
  if (!state || state.revoked) {
    return { valid: false, reason: "Pairing token is revoked or missing" }
  }
  if (state.expiresAt && Date.now() > state.expiresAt) {
    return { valid: false, reason: "Pairing token has expired" }
  }
  if (token && token !== state.token) {
    return { valid: false, reason: "Invalid pairing token" }
  }
  if (state.pin && pin !== state.pin) {
    return { valid: false, reason: "Invalid pairing PIN" }
  }
  return { valid: true }
}

export function getPairingSecret(): string {
  return PAIRING_SECRET
}