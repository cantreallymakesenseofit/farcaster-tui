import { hubGet } from "./client.ts"
import type {
  HubMessage,
  PaginatedResponse,
  UserProfile,
} from "./types.ts"

export async function getUserDataByFid(
  fid: number,
  userDataType?: number
): Promise<PaginatedResponse> {
  return hubGet<PaginatedResponse>("/userDataByFid", {
    fid,
    user_data_type: userDataType,
  })
}

export async function getUserNameProofByName(
  name: string
): Promise<{ fid: number; name: string; type: string }> {
  return hubGet("/userNameProofByName", { name })
}

export async function getUserProfile(fid: number): Promise<UserProfile> {
  const response = await getUserDataByFid(fid)
  const profile: UserProfile = {
    fid,
    displayName: "",
    username: "",
    bio: "",
    pfpUrl: "",
    url: "",
  }

  for (const msg of response.messages) {
    const body = msg.data.userDataBody
    if (!body) continue
    switch (body.type) {
      case "USER_DATA_TYPE_DISPLAY":
        profile.displayName = body.value
        break
      case "USER_DATA_TYPE_USERNAME":
        profile.username = body.value
        break
      case "USER_DATA_TYPE_BIO":
        profile.bio = body.value
        break
      case "USER_DATA_TYPE_PFP":
        profile.pfpUrl = body.value
        break
      case "USER_DATA_TYPE_URL":
        profile.url = body.value
        break
    }
  }

  return profile
}

const profileCache = new Map<number, { profile: UserProfile; ts: number }>()
const CACHE_TTL = 60_000

export async function getCachedUserProfile(
  fid: number
): Promise<UserProfile> {
  const cached = profileCache.get(fid)
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.profile
  const profile = await getUserProfile(fid)
  profileCache.set(fid, { profile, ts: Date.now() })
  return profile
}
