import React, { useState, useEffect, useContext } from "react"
import { Box, Text, useInput, useStdout } from "ink"
import { Spinner } from "@inkjs/ui"
import { AppContext } from "../app.tsx"
import { getCastsByMention } from "../hub/casts.ts"
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

export function Notifications() {
  const { fid, navigate, inputEnabled } = useContext(AppContext)
  const [mentions, setMentions] = useState<EnrichedCast[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [scrollOffset, setScrollOffset] = useState(0)

  const { stdout } = useStdout()
  const rows = stdout?.rows || 24
  // Header ~3, "Mentions" 1, footer 1, each cast ~5 lines
  const VISIBLE_COUNT = Math.max(2, Math.floor((rows - 5) / 5))

  useEffect(() => {
    loadNotifications()
  }, [fid])

  async function loadNotifications() {
    if (!fid) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const mentionsRes = await getCastsByMention(fid, {
        pageSize: 30,
        reverse: true,
      })

      const enriched = await Promise.all(mentionsRes.messages.map(enrichCast))
      setMentions(enriched.filter(Boolean) as EnrichedCast[])
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
          const next = Math.min(i + 1, mentions.length - 1)
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
        const cast = mentions[selectedIndex]
        if (cast)
          navigate({
            name: "thread",
            castFid: cast.fid,
            castHash: cast.hash,
          })
      }
      if (input === "R") {
        loadNotifications()
      }
    },
    { isActive: inputEnabled }
  )

  if (!fid) {
    return (
      <Box padding={1}>
        <Text dimColor>
          Import a signer to see your notifications.
        </Text>
      </Box>
    )
  }

  if (loading) {
    return (
      <Box padding={1}>
        <Spinner label="Loading notifications..." />
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

  if (mentions.length === 0) {
    return (
      <Box padding={1}>
        <Text dimColor>No mentions yet.</Text>
      </Box>
    )
  }

  const visible = mentions.slice(scrollOffset, scrollOffset + VISIBLE_COUNT)

  return (
    <Box flexDirection="column">
      <Box paddingX={1}>
        <Text bold>Mentions</Text>
      </Box>
      {visible.map((cast, i) => (
        <Cast
          key={cast.hash}
          cast={cast}
          selected={scrollOffset + i === selectedIndex}
        />
      ))}
      <Box paddingX={1} justifyContent="space-between">
        <Text dimColor>j/k:nav Enter:thread R:refresh</Text>
        <Text dimColor>
          {selectedIndex + 1}/{mentions.length}
        </Text>
      </Box>
    </Box>
  )
}
