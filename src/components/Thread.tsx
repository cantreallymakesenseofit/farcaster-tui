import React, { useState, useEffect, useContext } from "react"
import { Box, Text, useInput, useStdout } from "ink"
import { Spinner } from "@inkjs/ui"
import { AppContext } from "../app.tsx"
import { getCastById, getCastsByParent } from "../hub/casts.ts"
import { getCachedUserProfile } from "../hub/users.ts"
import { Cast } from "./Cast.tsx"
import type { EnrichedCast, HubMessage } from "../hub/types.ts"

async function enrichMessage(msg: HubMessage): Promise<EnrichedCast | null> {
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

export function Thread({
  castFid,
  castHash,
}: {
  castFid: number
  castHash: string
}) {
  const { navigate, inputEnabled } = useContext(AppContext)
  const [rootCast, setRootCast] = useState<EnrichedCast | null>(null)
  const [replies, setReplies] = useState<EnrichedCast[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [scrollOffset, setScrollOffset] = useState(0)

  const { stdout } = useStdout()
  const rows = stdout?.rows || 24
  // Header ~3, root cast ~6, reply count 1, footer 1, each reply ~5 lines
  const VISIBLE_COUNT = Math.max(2, Math.floor((rows - 11) / 5))

  useEffect(() => {
    loadThread()
  }, [castFid, castHash])

  async function loadThread() {
    setLoading(true)
    setError(null)
    try {
      const [rootMsg, repliesRes] = await Promise.all([
        getCastById(castFid, castHash),
        getCastsByParent(
          { fid: castFid, hash: castHash },
          { pageSize: 50 }
        ),
      ])

      const enrichedRoot = await enrichMessage(rootMsg)
      setRootCast(enrichedRoot)

      const enrichedReplies = await Promise.all(
        repliesRes.messages.map(enrichMessage)
      )
      setReplies(enrichedReplies.filter(Boolean) as EnrichedCast[])
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
          const next = Math.min(i + 1, replies.length - 1)
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
        const reply = replies[selectedIndex]
        if (reply)
          navigate({
            name: "thread",
            castFid: reply.fid,
            castHash: reply.hash,
          })
      }
      if (input === "r") {
        if (rootCast)
          navigate({
            name: "compose",
            parentCastId: { fid: rootCast.fid, hash: rootCast.hash },
          })
      }
      if (input === "o") {
        if (rootCast) navigate({ name: "profile", fid: rootCast.fid })
      }
    },
    { isActive: inputEnabled }
  )

  if (loading) {
    return (
      <Box padding={1}>
        <Spinner label="Loading thread..." />
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

  const visibleReplies = replies.slice(
    scrollOffset,
    scrollOffset + VISIBLE_COUNT
  )

  return (
    <Box flexDirection="column">
      {rootCast && (
        <Box
          flexDirection="column"
          borderStyle="double"
          borderColor="cyan"
          paddingX={1}
        >
          <Box gap={1}>
            <Text bold color="cyan">
              @{rootCast.authorUsername || `fid:${rootCast.fid}`}
            </Text>
            {rootCast.authorDisplayName && (
              <Text dimColor>{rootCast.authorDisplayName}</Text>
            )}
          </Box>
          <Text wrap="wrap">{rootCast.text}</Text>
          {rootCast.embeds.length > 0 && (
            <Box flexDirection="column">
              {rootCast.embeds.map((embed, i) => (
                <Text key={i} dimColor>
                  {embed.url ? `[link] ${embed.url}` : ""}
                </Text>
              ))}
            </Box>
          )}
        </Box>
      )}

      {replies.length > 0 && (
        <Box paddingX={1}>
          <Text dimColor>
            {replies.length} {replies.length === 1 ? "reply" : "replies"}
          </Text>
        </Box>
      )}

      {visibleReplies.map((reply, i) => (
        <Cast
          key={reply.hash}
          cast={reply}
          selected={scrollOffset + i === selectedIndex}
        />
      ))}

      <Box paddingX={1} justifyContent="space-between">
        <Text dimColor>
          j/k:nav Enter:subthread r:reply o:author profile q:back
        </Text>
        <Text dimColor>
          {replies.length > 0
            ? `${selectedIndex + 1}/${replies.length}`
            : ""}
        </Text>
      </Box>
    </Box>
  )
}
