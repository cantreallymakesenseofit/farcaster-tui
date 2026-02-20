import React, { useState, useContext } from "react"
import { Box, Text, useInput } from "ink"
import { TextInput, Spinner, StatusMessage } from "@inkjs/ui"
import { AppContext } from "../app.tsx"
import { getUserNameProofByName, getUserProfile } from "../hub/users.ts"
import type { UserProfile } from "../hub/types.ts"

export function Search() {
  const { navigate, setInputEnabled } = useContext(AppContext)
  const [query, setQuery] = useState("")
  const [searching, setSearching] = useState(false)
  const [result, setResult] = useState<UserProfile | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [inputActive, setInputActive] = useState(true)

  async function handleSearch(value: string) {
    const trimmed = value.trim()
    if (!trimmed) return

    setSearching(true)
    setError(null)
    setResult(null)
    setInputActive(false)
    setInputEnabled(false)

    try {
      let fid: number

      if (/^\d+$/.test(trimmed)) {
        fid = parseInt(trimmed, 10)
      } else {
        const name = trimmed.startsWith("@") ? trimmed.slice(1) : trimmed
        const proof = await getUserNameProofByName(name)
        fid = proof.fid
      }

      const profile = await getUserProfile(fid)
      setResult(profile)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSearching(false)
    }
  }

  useInput(
    (input, key) => {
      if (inputActive || searching) return

      if (key.return && result) {
        setInputEnabled(true)
        navigate({ name: "profile", fid: result.fid })
      }
      if (input === "s" || input === "/") {
        setInputActive(true)
        setInputEnabled(true)
        setResult(null)
        setError(null)
        setQuery("")
      }
    },
    { isActive: !inputActive }
  )

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold>Search by username or FID</Text>

      {inputActive && (
        <Box gap={1}>
          <Text color="cyan">&gt;</Text>
          <TextInput
            placeholder="username or FID..."
            onSubmit={handleSearch}
          />
        </Box>
      )}

      {searching && <Spinner label="Searching..." />}

      {error && (
        <Box flexDirection="column">
          <StatusMessage variant="error">{error}</StatusMessage>
          <Text dimColor>Press s to search again</Text>
        </Box>
      )}

      {result && (
        <Box flexDirection="column">
          <Box
            flexDirection="column"
            borderStyle="single"
            borderColor="green"
            paddingX={1}
          >
            <Box gap={2}>
              <Text bold color="cyan">
                @{result.username || `fid:${result.fid}`}
              </Text>
              {result.displayName && <Text>{result.displayName}</Text>}
              <Text dimColor>FID: {result.fid}</Text>
            </Box>
            {result.bio && <Text wrap="wrap">{result.bio}</Text>}
          </Box>
          <Text dimColor>Press Enter to view profile, s to search again</Text>
        </Box>
      )}
    </Box>
  )
}
