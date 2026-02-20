import {
  makeCastAdd,
  makeCastRemove,
  makeReactionAdd,
  makeReactionRemove,
  makeLinkAdd,
  makeLinkRemove,
  FarcasterNetwork,
  Message,
  type NobleEd25519Signer,
  type HubAsyncResult,
} from "@farcaster/hub-nodejs"
import { hubPost } from "./client.ts"

async function submitMessage(
  resultPromise: HubAsyncResult<Message>
): Promise<void> {
  const result = await resultPromise
  if (result.isErr()) {
    throw new Error(`Failed to create message: ${result.error.message}`)
  }
  const encoded = Message.encode(result.value).finish()
  await hubPost("/submitMessage", encoded)
}

export function hexToBytes(hex: string): Uint8Array {
  const clean = hex.startsWith("0x") ? hex.slice(2) : hex
  return new Uint8Array(Buffer.from(clean, "hex"))
}

export async function publishCast(
  signer: NobleEd25519Signer,
  fid: number,
  text: string,
  options?: {
    parentCastId?: { fid: number; hash: Uint8Array }
    parentUrl?: string
    embeds?: Array<{ url: string }>
    mentions?: number[]
    mentionsPositions?: number[]
  }
): Promise<void> {
  const dataOptions = { fid, network: FarcasterNetwork.MAINNET }
  await submitMessage(
    makeCastAdd(
      {
        text,
        type: 0,
        embeds: options?.embeds?.map((e) => ({ url: e.url })) ?? [],
        embedsDeprecated: [],
        mentions: options?.mentions ?? [],
        mentionsPositions: options?.mentionsPositions ?? [],
        parentCastId: options?.parentCastId,
        parentUrl: options?.parentUrl,
      },
      dataOptions,
      signer
    ) as HubAsyncResult<Message>
  )
}

export async function deleteCast(
  signer: NobleEd25519Signer,
  fid: number,
  targetHash: Uint8Array
): Promise<void> {
  const dataOptions = { fid, network: FarcasterNetwork.MAINNET }
  await submitMessage(
    makeCastRemove(
      { targetHash },
      dataOptions,
      signer
    ) as HubAsyncResult<Message>
  )
}

export async function likeCast(
  signer: NobleEd25519Signer,
  fid: number,
  targetFid: number,
  targetHash: Uint8Array
): Promise<void> {
  const dataOptions = { fid, network: FarcasterNetwork.MAINNET }
  await submitMessage(
    makeReactionAdd(
      {
        type: 1,
        targetCastId: { fid: targetFid, hash: targetHash },
      },
      dataOptions,
      signer
    ) as HubAsyncResult<Message>
  )
}

export async function unlikeCast(
  signer: NobleEd25519Signer,
  fid: number,
  targetFid: number,
  targetHash: Uint8Array
): Promise<void> {
  const dataOptions = { fid, network: FarcasterNetwork.MAINNET }
  await submitMessage(
    makeReactionRemove(
      {
        type: 1,
        targetCastId: { fid: targetFid, hash: targetHash },
      },
      dataOptions,
      signer
    ) as HubAsyncResult<Message>
  )
}

export async function recast(
  signer: NobleEd25519Signer,
  fid: number,
  targetFid: number,
  targetHash: Uint8Array
): Promise<void> {
  const dataOptions = { fid, network: FarcasterNetwork.MAINNET }
  await submitMessage(
    makeReactionAdd(
      {
        type: 2,
        targetCastId: { fid: targetFid, hash: targetHash },
      },
      dataOptions,
      signer
    ) as HubAsyncResult<Message>
  )
}

export async function unrecast(
  signer: NobleEd25519Signer,
  fid: number,
  targetFid: number,
  targetHash: Uint8Array
): Promise<void> {
  const dataOptions = { fid, network: FarcasterNetwork.MAINNET }
  await submitMessage(
    makeReactionRemove(
      {
        type: 2,
        targetCastId: { fid: targetFid, hash: targetHash },
      },
      dataOptions,
      signer
    ) as HubAsyncResult<Message>
  )
}

export async function follow(
  signer: NobleEd25519Signer,
  fid: number,
  targetFid: number
): Promise<void> {
  const dataOptions = { fid, network: FarcasterNetwork.MAINNET }
  await submitMessage(
    makeLinkAdd(
      { type: "follow", targetFid },
      dataOptions,
      signer
    ) as HubAsyncResult<Message>
  )
}

export async function unfollow(
  signer: NobleEd25519Signer,
  fid: number,
  targetFid: number
): Promise<void> {
  const dataOptions = { fid, network: FarcasterNetwork.MAINNET }
  await submitMessage(
    makeLinkRemove(
      { type: "follow", targetFid },
      dataOptions,
      signer
    ) as HubAsyncResult<Message>
  )
}
