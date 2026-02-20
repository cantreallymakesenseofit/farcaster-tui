import React, { useState, useEffect, useContext } from "react"
import { Box, Text, useInput } from "ink"
import { Spinner } from "@inkjs/ui"
import { AppContext } from "../app.tsx"
import { getCastsByFid } from "../hub/casts.ts"
import { getAllFollows } from "../hub/links.ts"
import { getCachedUserProfile } from "../hub/users.ts"
import { Cast } from "./Cast.tsx"
import type { EnrichedCast, HubMessage } from "../hub/types.ts"

async function enrichCast(msg: HubMessage): Promise<EnrichedCast | null> {
  const body = msg.data.castAddBody
  if (!body) return null

  let authorUsername = ""
  let authorDisplayName = ""
  try {
    const profile = await getCachedUserProfile(msg.data.fid)
    authorUsername = profile.username
    authorDisplayName = profile.displayName
  } catch {}

  return {
    fid: msg.data.fid,
    hash: msg.hash,
    text: body.text,
    timestamp: msg.data.timestamp,
    authorUsername,
    authorDisplayName,
    embeds: body.embeds || [],
    mentions: body.mentions || [],
    mentionsPositions: body.mentionsPositions || [],
    parentCastId: body.parentCastId,
    parentUrl: body.parentUrl,
  }
}

export function Feed() {
  const { fid, navigate, inputEnabled } = useContext(AppContext)
  const [casts, setCasts] = useState<EnrichedCast[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [scrollOffset, setScrollOffset] = useState(0)

  const VISIBLE_COUNT = 10

  useEffect(() => {
    fetchFeed()
  }, [fid])

  async function fetchFeed() {
    setLoading(true)
    setError(null)
    try {
      if (!fid) {
        // No FID set — show global recent casts from FID 3 (dwr) as sample
        const response = await getCastsByFid(3, {
          pageSize: 30,
          reverse: true,
        })
        const enriched = await Promise.all(response.messages.map(enrichCast))
        setCasts(enriched.filter(Boolean) as EnrichedCast[])
        return
      }

      // Get follows and fetch their recent casts
      const follows = await getAllFollows(fid)
      const limitedFollows = follows.slice(0, 50)

      const results = await Promise.allSettled(
        limitedFollows.map((followFid) =>
          getCastsByFid(followFid, { pageSize: 5, reverse: true })
        )
      )

      const allMessages: HubMessage[] = []
      for (const result of results) {
        if (result.status === "fulfilled") {
          allMessages.push(...result.value.messages)
        }
      }

      // Also include own casts
      try {
        const ownCasts = await getCastsByFid(fid, {
          pageSize: 10,
          reverse: true,
        })
        allMessages.push(...ownCasts.messages)
      } catch {}

      // Sort by timestamp descending
      allMessages.sort((a, b) => b.data.timestamp - a.data.timestamp)

      // Enrich top 50
      const top = allMessages.slice(0, 50)
      const enriched = await Promise.all(top.map(enrichCast))
      setCasts(enriched.filter(Boolean) as EnrichedCast[])
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
        if (cast) navigate({ name: "thread", castFid: cast.fid, castHash: cast.hash })
      }
      if (input === "r") {
        const cast = casts[selectedIndex]
        if (cast)
          navigate({
            name: "compose",
            parentCastId: { fid: cast.fid, hash: cast.hash },
          })
      }
      if (input === "o") {
        const cast = casts[selectedIndex]
        if (cast)
          navigate({ name: "profile", fid: cast.fid })
      }
      if (input === "g") {
        setSelectedIndex(0)
        setScrollOffset(0)
      }
      if (input === "G") {
        const last = casts.length - 1
        setSelectedIndex(last)
        setScrollOffset(Math.max(0, last - VISIBLE_COUNT + 1))
      }
      if (input === "R") {
        fetchFeed()
      }
    },
    { isActive: inputEnabled }
  )

  if (loading) {
    return (
      <Box padding={1}>
        <Spinner label="Loading feed..." />
      </Box>
    )
  }

  if (error) {
    return (
      <Box padding={1} flexDirection="column">
        <Text color="red">Error: {error}</Text>
        <Text dimColor>Press R to retry</Text>
      </Box>
    )
  }

  if (casts.length === 0) {
    return (
      <Box padding={1} flexDirection="column">
        <Text>No casts to show.</Text>
        <Text dimColor>
          {fid
            ? "Follow some users to see their casts here."
            : "Set your FID in settings or import a signer to see your feed."}
        </Text>
      </Box>
    )
  }

  const visible = casts.slice(scrollOffset, scrollOffset + VISIBLE_COUNT)

  return (
    <Box flexDirection="column">
      {visible.map((cast, i) => (
        <Cast
          key={cast.hash}
          cast={cast}
          selected={scrollOffset + i === selectedIndex}
        />
      ))}
      <Box paddingX={1} justifyContent="space-between">
        <Text dimColor>
          j/k:nav Enter:thread r:reply o:profile R:refresh g/G:top/bottom
        </Text>
        <Text dimColor>
          {selectedIndex + 1}/{casts.length}
        </Text>
      </Box>
    </Box>
  )
}
