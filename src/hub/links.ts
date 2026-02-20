import { hubGet } from "./client.ts"
import type { HubMessage, PaginatedResponse, PaginationOptions } from "./types.ts"

export async function getLinkById(
  fid: number,
  targetFid: number,
  linkType: string = "follow"
): Promise<HubMessage> {
  return hubGet<HubMessage>("/linkById", {
    fid,
    target_fid: targetFid,
    link_type: linkType,
  })
}

export async function getLinksByFid(
  fid: number,
  linkType: string = "follow",
  options?: PaginationOptions
): Promise<PaginatedResponse> {
  return hubGet<PaginatedResponse>("/linksByFid", {
    fid,
    link_type: linkType,
    ...options,
  })
}

export async function getLinksByTargetFid(
  targetFid: number,
  linkType: string = "follow",
  options?: PaginationOptions
): Promise<PaginatedResponse> {
  return hubGet<PaginatedResponse>("/linksByTargetFid", {
    target_fid: targetFid,
    link_type: linkType,
    ...options,
  })
}

export async function getAllFollows(fid: number): Promise<number[]> {
  const fids: number[] = []
  let pageToken: string | undefined

  do {
    const response = await getLinksByFid(fid, "follow", {
      pageSize: 1000,
      pageToken,
    })
    for (const msg of response.messages) {
      if (msg.data.linkBody?.targetFid) {
        fids.push(msg.data.linkBody.targetFid)
      }
    }
    pageToken = response.nextPageToken
  } while (pageToken)

  return fids
}
