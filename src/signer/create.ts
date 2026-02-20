import { ed25519 } from "@noble/curves/ed25519"

export function importSigner(privateKeyHex: string): {
  privateKey: Uint8Array
  publicKey: Uint8Array
} {
  const hex = privateKeyHex.startsWith("0x")
    ? privateKeyHex.slice(2)
    : privateKeyHex
  const privateKey = new Uint8Array(Buffer.from(hex, "hex"))
  const publicKey = ed25519.getPublicKey(privateKey)
  return { privateKey, publicKey }
}

export function validatePrivateKey(hex: string): boolean {
  try {
    const clean = hex.startsWith("0x") ? hex.slice(2) : hex
    if (clean.length !== 64) return false
    if (!/^[0-9a-fA-F]+$/.test(clean)) return false
    const bytes = new Uint8Array(Buffer.from(clean, "hex"))
    ed25519.getPublicKey(bytes)
    return true
  } catch {
    return false
  }
}
