import React from "react"
import { Box, Text } from "ink"
import type { EnrichedCast } from "../hub/types.ts"
import { formatRelativeTime } from "../hub/types.ts"

interface CastProps {
  cast: EnrichedCast
  selected: boolean
  compact?: boolean
  maxLines?: number
}

function truncateText(text: string, maxLines: number): string {
  const lines = text.split("\n")
  if (lines.length <= maxLines) return text
  return lines.slice(0, maxLines).join("\n") + "..."
}

export function Cast({ cast, selected, compact, maxLines = 3 }: CastProps) {
  const borderColor = selected ? "cyan" : "gray"
  const displayText = compact
    ? truncateText(cast.text, 2)
    : truncateText(cast.text, maxLines)

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
      <Text wrap="truncate-end">{displayText}</Text>
      {!compact && cast.embeds.length > 0 && (
        <Text dimColor>
          {cast.embeds
            .slice(0, 2)
            .map((e) => (e.url ? `[link] ${e.url}` : ""))
            .filter(Boolean)
            .join(" ")}
        </Text>
      )}
    </Box>
  )
}
