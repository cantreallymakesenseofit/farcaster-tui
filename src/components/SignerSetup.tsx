import React, { useState, useContext } from "react"
import { Box, Text } from "ink"
import { TextInput, StatusMessage, Spinner } from "@inkjs/ui"
import { AppContext } from "../app.tsx"
import { importSigner, validatePrivateKey } from "../signer/create.ts"
import { addSigner } from "../signer/store.ts"
import { clearSignerCache } from "../signer/sign.ts"

type Step =
  | "private-key"
  | "fid"
  | "label"
  | "password"
  | "password-confirm"
  | "saving"
  | "done"
  | "error"

export function SignerSetup() {
  const { goBack, setFid, setInputEnabled } = useContext(AppContext)
  const [step, setStep] = useState<Step>("private-key")
  const [privateKeyHex, setPrivateKeyHex] = useState("")
  const [fid, setLocalFid] = useState(0)
  const [label, setLabel] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  async function handlePrivateKey(value: string) {
    const trimmed = value.trim()
    if (!validatePrivateKey(trimmed)) {
      setError("Invalid Ed25519 private key. Must be 64 hex characters.")
      setStep("error")
      return
    }
    setPrivateKeyHex(trimmed)
    setStep("fid")
  }

  function handleFid(value: string) {
    const parsed = parseInt(value.trim(), 10)
    if (isNaN(parsed) || parsed <= 0) {
      setError("FID must be a positive number.")
      setStep("error")
      return
    }
    setLocalFid(parsed)
    setStep("label")
  }

  function handleLabel(value: string) {
    setLabel(value.trim() || `signer-${Date.now()}`)
    setStep("password")
  }

  function handlePassword(value: string) {
    if (!value || value.length < 1) {
      setError("Password cannot be empty.")
      setStep("error")
      return
    }
    setPassword(value)
    setStep("password-confirm")
  }

  async function handlePasswordConfirm(value: string) {
    if (value !== password) {
      setError("Passwords do not match.")
      setStep("error")
      return
    }

    setStep("saving")
    try {
      const { privateKey, publicKey } = importSigner(privateKeyHex)
      await addSigner(fid, privateKey, publicKey, label, password)
      setFid(fid)
      clearSignerCache()
      setStep("done")
      setTimeout(() => {
        setInputEnabled(true)
        goBack()
      }, 2000)
    } catch (e: any) {
      setError(e.message)
      setStep("error")
    }
  }

  function retry() {
    setError("")
    setStep("private-key")
  }

  return (
    <Box flexDirection="column" padding={1} gap={1}>
      <Text bold>Import Signer</Text>
      <Text dimColor>
        Paste your Ed25519 signer private key (hex). Create one via Warpcast or
        another Farcaster client.
      </Text>

      {step === "private-key" && (
        <Box gap={1}>
          <Text>Private key (hex):</Text>
          <TextInput
            placeholder="0x... or hex string (64 chars)"
            onSubmit={handlePrivateKey}
          />
        </Box>
      )}

      {step === "fid" && (
        <Box gap={1}>
          <Text>Your Farcaster ID (FID):</Text>
          <TextInput placeholder="e.g. 12345" onSubmit={handleFid} />
        </Box>
      )}

      {step === "label" && (
        <Box gap={1}>
          <Text>Label for this signer (optional):</Text>
          <TextInput placeholder="my-signer" onSubmit={handleLabel} />
        </Box>
      )}

      {step === "password" && (
        <Box gap={1}>
          <Text>Encryption password:</Text>
          <TextInput placeholder="password to encrypt signer key" onSubmit={handlePassword} />
        </Box>
      )}

      {step === "password-confirm" && (
        <Box gap={1}>
          <Text>Confirm password:</Text>
          <TextInput placeholder="re-enter password" onSubmit={handlePasswordConfirm} />
        </Box>
      )}

      {step === "saving" && <Spinner label="Saving signer..." />}

      {step === "done" && (
        <StatusMessage variant="success">
          Signer imported for FID {fid}! Returning...
        </StatusMessage>
      )}

      {step === "error" && (
        <Box flexDirection="column">
          <StatusMessage variant="error">{error}</StatusMessage>
          <Text dimColor>Press any key to retry</Text>
        </Box>
      )}
    </Box>
  )
}
