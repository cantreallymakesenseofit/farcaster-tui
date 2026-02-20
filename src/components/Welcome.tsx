import React, { useState, useContext } from "react"
import { Box, Text, useInput } from "ink"
import { TextInput, Spinner, StatusMessage } from "@inkjs/ui"
import { AppContext } from "../app.tsx"
import { getUserNameProofByName, getUserProfile } from "../hub/users.ts"
import { saveConfig, loadConfig } from "../config/store.ts"
import type { UserProfile } from "../hub/types.ts"

type Step = "input" | "searching" | "confirm" | "error"

export function Welcome() {
  const { setFid, navigate } = useContext(AppContext)
  const [step, setStep] = useState<Step>("input")
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [error, setError] = useState("")

  async function handleInput(value: string) {
    const trimmed = value.trim()
    if (!trimmed) return

    setStep("searching")
    try {
      let fid: number

      if (/^\d+$/.test(trimmed)) {
        fid = parseInt(trimmed, 10)
      } else {
        const name = trimmed.startsWith("@") ? trimmed.slice(1) : trimmed
        const proof = await getUserNameProofByName(name)
        fid = proof.fid
      }

      const prof = await getUserProfile(fid)
      setProfile(prof)
      setStep("confirm")
    } catch (e: any) {
      setError(e.message)
      setStep("error")
    }
  }

  async function confirm() {
    if (!profile) return
    const config = await loadConfig()
    config.fid = profile.fid
    await saveConfig(config)
    setFid(profile.fid)
    navigate({ name: "feed" })
  }

  function retry() {
    setError("")
    setProfile(null)
    setStep("input")
  }

  useInput(
    (_input, key) => {
      if (step === "confirm") {
        if (key.return) {
          confirm()
        } else {
          retry()
        }
      }
      if (step === "error") {
        retry()
      }
    },
    { isActive: step === "confirm" || step === "error" }
  )

  return (
    <Box flexDirection="column" padding={1} gap={1}>
      <Text bold color="cyan">
        Welcome to farcaster-tui
      </Text>
      <Text>Enter your Farcaster username or FID to get started.</Text>
      <Text dimColor>
        This is only used to load your feed (who you follow). No signer needed
        for reading.
      </Text>

      {step === "input" && (
        <Box gap={1}>
          <Text color="cyan">&gt;</Text>
          <TextInput
            placeholder="username or FID"
            onSubmit={handleInput}
          />
        </Box>
      )}

      {step === "searching" && <Spinner label="Looking up..." />}

      {step === "confirm" && profile && (
        <Box flexDirection="column" gap={1}>
          <Box
            flexDirection="column"
            borderStyle="single"
            borderColor="green"
            paddingX={1}
          >
            <Box gap={2}>
              <Text bold color="cyan">
                @{profile.username || `fid:${profile.fid}`}
              </Text>
              {profile.displayName && <Text>{profile.displayName}</Text>}
              <Text dimColor>FID: {profile.fid}</Text>
            </Box>
            {profile.bio && <Text wrap="wrap">{profile.bio}</Text>}
          </Box>
          <Text>
            Is this you? Press <Text bold>Enter</Text> to confirm, any other
            key to try again.
          </Text>
        </Box>
      )}

      {step === "error" && (
        <Box flexDirection="column">
          <StatusMessage variant="error">{error}</StatusMessage>
          <Text dimColor>Press any key to try again</Text>
        </Box>
      )}
    </Box>
  )
}
