import { hubGet } from "./client.ts"
import type { HubMessage, PaginatedResponse, PaginationOptions } from "./types.ts"

export async function getCastById(
  fid: number,
  hash: string
): Promise<HubMessage> {
  return hubGet<HubMessage>("/castById", { fid, hash })
}

export async function getCastsByFid(
  fid: number,
  options?: PaginationOptions & {
    startTimestamp?: number
    stopTimestamp?: number
  }
): Promise<PaginatedResponse> {
  return hubGet<PaginatedResponse>("/castsByFid", {
    fid,
    ...options,
    reverse: options?.reverse ?? true,
  })
}

export async function getCastsByParent(
  parent: { fid: number; hash: string } | { url: string },
  options?: PaginationOptions
): Promise<PaginatedResponse> {
  return hubGet<PaginatedResponse>("/castsByParent", {
    ...parent,
    ...options,
  })
}

export async function getCastsByMention(
  fid: number,
  options?: PaginationOptions
): Promise<PaginatedResponse> {
  return hubGet<PaginatedResponse>("/castsByMention", {
    fid,
    ...options,
    reverse: options?.reverse ?? true,
  })
}
