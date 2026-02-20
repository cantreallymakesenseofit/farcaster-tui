import React, { useState, useEffect, useContext } from "react"
import { Box, Text, useInput } from "ink"
import { Spinner } from "@inkjs/ui"
import { AppContext } from "../app.tsx"
import { getUserProfile } from "../hub/users.ts"
import { getCastsByFid } from "../hub/casts.ts"
import { getLinksByFid, getLinksByTargetFid } from "../hub/links.ts"
import { Cast } from "./Cast.tsx"
import type { EnrichedCast, UserProfile as UserProfileType } from "../hub/types.ts"

export function Profile({ fid }: { fid: number }) {
  const { navigate, inputEnabled } = useContext(AppContext)
  const [profile, setProfile] = useState<UserProfileType | null>(null)
  const [casts, setCasts] = useState<EnrichedCast[]>([])
  const [following, setFollowing] = useState<number | null>(null)
  const [followers, setFollowers] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [scrollOffset, setScrollOffset] = useState(0)

  const VISIBLE_COUNT = 8

  useEffect(() => {
    loadProfile()
  }, [fid])

  async function loadProfile() {
    setLoading(true)
    setError(null)
    try {
      const [prof, castsRes] = await Promise.all([
        getUserProfile(fid),
        getCastsByFid(fid, { pageSize: 30, reverse: true }),
      ])

      setProfile(prof)

      const enriched: EnrichedCast[] = castsRes.messages
        .filter((m) => m.data.castAddBody)
        .map((m) => ({
          fid: m.data.fid,
          hash: m.hash,
          text: m.data.castAddBody!.text,
          timestamp: m.data.timestamp,
          authorUsername: prof.username,
          authorDisplayName: prof.displayName,
          embeds: m.data.castAddBody!.embeds || [],
          mentions: m.data.castAddBody!.mentions || [],
          mentionsPositions: m.data.castAddBody!.mentionsPositions || [],
          parentCastId: m.data.castAddBody!.parentCastId,
          parentUrl: m.data.castAddBody!.parentUrl,
        }))
      setCasts(enriched)

      // Fetch counts in background
      Promise.all([
        getLinksByFid(fid, "follow", { pageSize: 1 }).then((r) => {
          // Rough count — just get one page to confirm they follow people
          setFollowing(r.messages.length > 0 ? -1 : 0) // -1 = has follows
        }),
        getLinksByTargetFid(fid, "follow", { pageSize: 1 }).then((r) => {
          setFollowers(r.messages.length > 0 ? -1 : 0)
        }),
      ]).catch(() => {})
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useInput(
    (input, key) => {
      if (loading) return

      if (input === "j" || key.downArrow) {
        setSelectedIndex((i) => {
          const next = Math.min(i + 1, casts.length - 1)
          if (next >= scrollOffset + VISIBLE_COUNT)
            setScrollOffset(next - VISIBLE_COUNT + 1)
          return next
        })
      }
      if (input === "k" || key.upArrow) {
        setSelectedIndex((i) => {
          const next = Math.max(i - 1, 0)
          if (next < scrollOffset) setScrollOffset(next)
          return next
        })
      }
      if (key.return) {
        const cast = casts[selectedIndex]
        if (cast)
          navigate({
            name: "thread",
            castFid: cast.fid,
            castHash: cast.hash,
          })
      }
      if (input === "r") {
        const cast = casts[selectedIndex]
        if (cast)
          navigate({
            name: "compose",
            parentCastId: { fid: cast.fid, hash: cast.hash },
          })
      }
    },
    { isActive: inputEnabled }
  )

  if (loading) {
    return (
      <Box padding={1}>
        <Spinner label={`Loading profile for FID ${fid}...`} />
      </Box>
    )
  }

  if (error) {
    return (
      <Box padding={1}>
        <Text color="red">Error: {error}</Text>
      </Box>
    )
  }

  if (!profile) return null

  const visible = casts.slice(scrollOffset, scrollOffset + VISIBLE_COUNT)

  return (
    <Box flexDirection="column">
      <Box
        flexDirection="column"
        borderStyle="single"
        borderColor="cyan"
        paddingX={1}
      >
        <Box gap={2}>
          <Text bold color="cyan">
            @{profile.username || `fid:${fid}`}
          </Text>
          {profile.displayName && <Text>{profile.displayName}</Text>}
          <Text dimColor>FID: {fid}</Text>
        </Box>
        {profile.bio && <Text wrap="wrap">{profile.bio}</Text>}
        {profile.url && <Text dimColor>{profile.url}</Text>}
        <Box gap={2}>
          <Text>
            Following: {following === null ? "..." : following === -1 ? "yes" : "0"}
          </Text>
          <Text>
            Followers: {followers === null ? "..." : followers === -1 ? "yes" : "0"}
          </Text>
          <Text dimColor>Casts: {casts.length}</Text>
        </Box>
      </Box>
      {visible.map((cast, i) => (
        <Cast
          key={cast.hash}
          cast={cast}
          selected={scrollOffset + i === selectedIndex}
          compact
        />
      ))}
      <Box paddingX={1} justifyContent="space-between">
        <Text dimColor>j/k:nav Enter:thread r:reply</Text>
        <Text dimColor>
          {casts.length > 0 ? `${selectedIndex + 1}/${casts.length}` : ""}
        </Text>
      </Box>
    </Box>
  )
}
