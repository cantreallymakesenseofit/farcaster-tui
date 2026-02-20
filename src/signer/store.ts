import {
  createCipheriv,
  createDecipheriv,
  scryptSync,
  randomBytes,
} from "node:crypto"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import { homedir } from "node:os"
import { join } from "node:path"

export interface StoredSigner {
  fid: number
  publicKey: string
  encryptedPrivateKey: string
  label: string
  createdAt: string
}

export interface SignersFile {
  signers: StoredSigner[]
  activeSignerPublicKey: string | null
}

const CONFIG_DIR = join(homedir(), ".config", "farcaster-tui")
const SIGNERS_PATH = join(CONFIG_DIR, "signers.json")

function encrypt(data: Uint8Array, password: string): string {
  const salt = randomBytes(16)
  const key = scryptSync(password, salt, 32)
  const iv = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", key, iv)
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()])
  const tag = cipher.getAuthTag()
  return [
    salt.toString("base64"),
    iv.toString("base64"),
    encrypted.toString("base64"),
    tag.toString("base64"),
  ].join(":")
}

function decrypt(encoded: string, password: string): Uint8Array {
  const [saltB64, ivB64, encB64, tagB64] = encoded.split(":")
  const salt = Buffer.from(saltB64, "base64")
  const iv = Buffer.from(ivB64, "base64")
  const encrypted = Buffer.from(encB64, "base64")
  const tag = Buffer.from(tagB64, "base64")
  const key = scryptSync(password, salt, 32)
  const decipher = createDecipheriv("aes-256-gcm", key, iv)
  decipher.setAuthTag(tag)
  return new Uint8Array(
    Buffer.concat([decipher.update(encrypted), decipher.final()])
  )
}

export async function loadSigners(): Promise<SignersFile> {
  try {
    const data = await readFile(SIGNERS_PATH, "utf-8")
    return JSON.parse(data)
  } catch {
    return { signers: [], activeSignerPublicKey: null }
  }
}

export async function saveSigners(file: SignersFile): Promise<void> {
  await mkdir(CONFIG_DIR, { recursive: true })
  await writeFile(SIGNERS_PATH, JSON.stringify(file, null, 2))
}

export async function addSigner(
  fid: number,
  privateKey: Uint8Array,
  publicKey: Uint8Array,
  label: string,
  password: string
): Promise<void> {
  const file = await loadSigners()
  const encryptedPrivateKey = encrypt(privateKey, password)
  const pubKeyHex = Buffer.from(publicKey).toString("hex")

  file.signers.push({
    fid,
    publicKey: pubKeyHex,
    encryptedPrivateKey,
    label,
    createdAt: new Date().toISOString(),
  })

  if (!file.activeSignerPublicKey) {
    file.activeSignerPublicKey = pubKeyHex
  }

  await saveSigners(file)
}

export async function removeSigner(publicKey: string): Promise<void> {
  const file = await loadSigners()
  file.signers = file.signers.filter((s) => s.publicKey !== publicKey)
  if (file.activeSignerPublicKey === publicKey) {
    file.activeSignerPublicKey = file.signers[0]?.publicKey ?? null
  }
  await saveSigners(file)
}

export async function setActiveSigner(publicKey: string): Promise<void> {
  const file = await loadSigners()
  file.activeSignerPublicKey = publicKey
  await saveSigners(file)
}

export function decryptSignerKey(
  encrypted: string,
  password: string
): Uint8Array {
  return decrypt(encrypted, password)
}

export async function getActiveSignerData(
  password: string
): Promise<{ fid: number; privateKey: Uint8Array } | null> {
  const file = await loadSigners()
  if (!file.activeSignerPublicKey) return null

  const signer = file.signers.find(
    (s) => s.publicKey === file.activeSignerPublicKey
  )
  if (!signer) return null

  const privateKey = decrypt(signer.encryptedPrivateKey, password)
  return { fid: signer.fid, privateKey }
}
