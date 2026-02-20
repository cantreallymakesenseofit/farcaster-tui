import { NobleEd25519Signer } from "@farcaster/hub-nodejs"
import { getActiveSignerData } from "./store.ts"

let cachedSigner: NobleEd25519Signer | null = null
let cachedFid: number | null = null

export async function getCurrentSigner(
  password: string
): Promise<{ signer: NobleEd25519Signer; fid: number } | null> {
  if (cachedSigner && cachedFid)
    return { signer: cachedSigner, fid: cachedFid }

  const data = await getActiveSignerData(password)
  if (!data) return null

  cachedSigner = new NobleEd25519Signer(data.privateKey)
  cachedFid = data.fid
  return { signer: cachedSigner, fid: cachedFid }
}

export function clearSignerCache() {
  cachedSigner = null
  cachedFid = null
}
