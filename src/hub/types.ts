export const FARCASTER_EPOCH = 1609459200

export function farcasterTimestampToDate(ts: number): Date {
  return new Date((ts + FARCASTER_EPOCH) * 1000)
}

export function formatRelativeTime(ts: number): string {
  const now = Date.now()
  const date = farcasterTimestampToDate(ts)
  const diff = now - date.getTime()
  const seconds = Math.floor(diff / 1000)

  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo`
  return `${Math.floor(months / 12)}y`
}

export interface CastAddBody {
  text: string
  mentions: number[]
  mentionsPositions: number[]
  embeds: Array<{ url?: string; castId?: { fid: number; hash: string } }>
  parentCastId?: { fid: number; hash: string }
  parentUrl?: string
  type?: string
}

export interface ReactionBody {
  type: string
  targetCastId?: { fid: number; hash: string }
  targetUrl?: string
}

export interface LinkBody {
  type: string
  targetFid?: number
}

export interface UserDataBody {
  type: string
  value: string
}

export interface HubMessageData {
  type: string
  fid: number
  timestamp: number
  network: string
  castAddBody?: CastAddBody
  castRemoveBody?: { targetHash: string }
  reactionBody?: ReactionBody
  linkBody?: LinkBody
  userDataBody?: UserDataBody
}

export interface HubMessage {
  data: HubMessageData
  hash: string
  hashScheme: string
  signature: string
  signatureScheme: string
  signer: string
}

export interface PaginatedResponse {
  messages: HubMessage[]
  nextPageToken?: string
}

export interface UserProfile {
  fid: number
  displayName: string
  username: string
  bio: string
  pfpUrl: string
  url: string
}

export interface EnrichedCast {
  fid: number
  hash: string
  text: string
  timestamp: number
  authorUsername: string
  authorDisplayName: string
  embeds: CastAddBody["embeds"]
  mentions: number[]
  mentionsPositions: number[]
  parentCastId?: { fid: number; hash: string }
  parentUrl?: string
}

export interface HubInfo {
  version: string
  numShards: number
  dbStats?: {
    numMessages: number
    numFidRegistrations: number
    approxSize: number
  }
}

export interface PaginationOptions {
  pageSize?: number
  pageToken?: string
  reverse?: boolean
}
