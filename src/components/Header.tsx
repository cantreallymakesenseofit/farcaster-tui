import React from "react"
import { Box, Text } from "ink"

interface HeaderProps {
  currentScreen: string
  fid: number | null
  hubUrl: string
}

export function Header({ currentScreen, fid, hubUrl }: HeaderProps) {
  const screens: Record<string, string> = {
    feed: "Feed",
    notifications: "Notifications",
    search: "Search",
    profile: "Profile",
    thread: "Thread",
    compose: "Compose",
    "signer-setup": "Import Signer",
    "signer-manager": "Signers",
    settings: "Settings",
  }

  return (
    <Box
      borderStyle="single"
      borderColor="gray"
      paddingX={1}
      justifyContent="space-between"
    >
      <Box gap={1}>
        <Text bold color="cyan">
          farcaster-tui
        </Text>
        <Text color="white"> {screens[currentScreen] || currentScreen}</Text>
      </Box>
      <Box gap={2}>
        <Text dimColor>
          [1]Feed [2]Notifs [3]Search [4]Profile [n]New [s]Signers [?]Settings
          [q]Quit
        </Text>
      </Box>
      <Box gap={1}>
        <Text color={fid ? "green" : "yellow"}>
          {fid ? `FID:${fid}` : "No signer"}
        </Text>
        <Text dimColor>{new URL(hubUrl).hostname}</Text>
      </Box>
    </Box>
  )
}
