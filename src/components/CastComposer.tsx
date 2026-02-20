import React, { useState, useContext } from "react"
import { Box, Text } from "ink"
import { TextInput, Spinner, StatusMessage } from "@inkjs/ui"
import { AppContext } from "../app.tsx"
import { publishCast, hexToBytes } from "../hub/submit.ts"
import { getCurrentSigner } from "../signer/sign.ts"

interface CastComposerProps {
  parentCastId?: { fid: number; hash: string }
}

type Step = "password" | "editing" | "submitting" | "done" | "error"

export function CastComposer({ parentCastId }: CastComposerProps) {
  const { goBack, password, setInputEnabled } = useContext(AppContext)
  const [step, setStep] = useState<Step>(password ? "editing" : "password")
  const [sessionPassword, setSessionPassword] = useState(password || "")
  const [error, setError] = useState("")

  function handlePassword(value: string) {
    setSessionPassword(value)
    setStep("editing")
  }

  async function handleSubmit(text: string) {
    const trimmed = text.trim()
    if (!trimmed) return

    const byteLength = new TextEncoder().encode(trimmed).length
    if (byteLength > 320) {
      setError(`Cast too long: ${byteLength}/320 bytes`)
      setStep("error")
      return
    }

    setStep("submitting")
    try {
      const signerData = await getCurrentSigner(sessionPassword)
      if (!signerData) {
        setError("No active signer. Import one first.")
        setStep("error")
        return
      }

      const { signer, fid } = signerData

      await publishCast(signer, fid, trimmed, {
        parentCastId: parentCastId
          ? {
              fid: parentCastId.fid,
              hash: hexToBytes(parentCastId.hash),
            }
          : undefined,
      })

      setStep("done")
      setTimeout(() => {
        setInputEnabled(true)
        goBack()
      }, 1500)
    } catch (e: any) {
      setError(e.message)
      setStep("error")
    }
  }

  return (
    <Box flexDirection="column" padding={1} gap={1}>
      <Text bold>{parentCastId ? "Reply" : "New Cast"}</Text>

      {step === "password" && (
        <Box gap={1}>
          <Text>Signer password:</Text>
          <TextInput placeholder="password" onSubmit={handlePassword} />
        </Box>
      )}

      {step === "editing" && (
        <Box flexDirection="column">
          {parentCastId && (
            <Text dimColor>
              Replying to cast {parentCastId.hash.slice(0, 10)}...
            </Text>
          )}
          <Box gap={1}>
            <Text color="cyan">&gt;</Text>
            <TextInput
              placeholder="What's on your mind? (max 320 bytes)"
              onSubmit={handleSubmit}
            />
          </Box>
          <Text dimColor>Enter to submit, Esc to cancel</Text>
        </Box>
      )}

      {step === "submitting" && <Spinner label="Publishing cast..." />}

      {step === "done" && (
        <StatusMessage variant="success">Cast published!</StatusMessage>
      )}

      {step === "error" && (
        <Box flexDirection="column">
          <StatusMessage variant="error">{error}</StatusMessage>
          <Text dimColor>Press q to go back</Text>
        </Box>
      )}
    </Box>
  )
}
