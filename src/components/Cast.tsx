import React from "react"
import { Box, Text } from "ink"
import type { EnrichedCast } from "../hub/types.ts"
import { formatRelativeTime } from "../hub/types.ts"

interface CastProps {
  cast: EnrichedCast
  selected: boolean
  compact?: boolean
}

export function Cast({ cast, selected, compact }: CastProps) {
  const borderColor = selected ? "cyan" : "gray"

  return (
    <Box
      flexDirection="column"
      borderStyle={selected ? "bold" : "single"}
      borderColor={borderColor}
      paddingX={1}
    >
      <Box gap={1}>
        <Text bold color={selected ? "cyan" : "blue"}>
          @{cast.authorUsername || `fid:${cast.fid}`}
        </Text>
        {cast.authorDisplayName && (
          <Text dimColor>{cast.authorDisplayName}</Text>
        )}
        <Text dimColor>{formatRelativeTime(cast.timestamp)}</Text>
        {cast.parentCastId && <Text dimColor>[reply]</Text>}
      </Box>
      <Text wrap="wrap">{cast.text}</Text>
      {!compact && cast.embeds.length > 0 && (
        <Box flexDirection="column">
          {cast.embeds.map((embed, i) => (
            <Text key={i} dimColor>
              {embed.url
                ? `[link] ${embed.url}`
                : embed.castId
                  ? `[quote] ${embed.castId.hash.slice(0, 10)}...`
                  : ""}
            </Text>
          ))}
        </Box>
      )}
    </Box>
  )
}
