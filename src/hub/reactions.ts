import { hubGet } from "./client.ts"
import type { HubMessage, PaginatedResponse, PaginationOptions } from "./types.ts"

export async function getReactionById(
  fid: number,
  targetFid: number,
  targetHash: string,
  reactionType: number
): Promise<HubMessage> {
  return hubGet<HubMessage>("/reactionById", {
    fid,
    target_fid: targetFid,
    target_hash: targetHash,
    reaction_type: reactionType,
  })
}

export async function getReactionsByFid(
  fid: number,
  reactionType: number,
  options?: PaginationOptions
): Promise<PaginatedResponse> {
  return hubGet<PaginatedResponse>("/reactionsByFid", {
    fid,
    reaction_type: reactionType,
    ...options,
  })
}

export async function getReactionsByCast(
  targetFid: number,
  targetHash: string,
  reactionType: number,
  options?: PaginationOptions
): Promise<PaginatedResponse> {
  return hubGet<PaginatedResponse>("/reactionsByCast", {
    target_fid: targetFid,
    target_hash: targetHash,
    reaction_type: reactionType,
    ...options,
  })
}
