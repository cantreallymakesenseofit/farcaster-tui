import React, { useState, useEffect, useContext } from "react"
import { Box, Text } from "ink"
import { TextInput, StatusMessage } from "@inkjs/ui"
import { AppContext } from "../app.tsx"
import { loadConfig, saveConfig, type Config } from "../config/store.ts"
import { setHubUrl, getHubUrl } from "../hub/client.ts"
import { hubGet } from "../hub/client.ts"
import type { HubInfo } from "../hub/types.ts"

type Step = "menu" | "hub-url" | "fid" | "saved"

export function Settings() {
  const { goBack, setFid: setAppFid, setInputEnabled } = useContext(AppContext)
  const [step, setStep] = useState<Step>("menu")
  const [config, setConfig] = useState<Config | null>(null)
  const [hubInfo, setHubInfo] = useState<HubInfo | null>(null)

  useEffect(() => {
    loadConfig().then(setConfig)
    hubGet<HubInfo>("/info", { dbstats: 1 })
      .then(setHubInfo)
      .catch(() => {})
  }, [])

  function startEditHubUrl() {
    setStep("hub-url")
    setInputEnabled(false)
  }

  function startEditFid() {
    setStep("fid")
    setInputEnabled(false)
  }

  async function handleHubUrl(value: string) {
    const trimmed = value.trim()
    if (trimmed) {
      setHubUrl(trimmed)
      const newConfig = { ...config!, hubUrl: trimmed }
      await saveConfig(newConfig)
      setConfig(newConfig)
    }
    setInputEnabled(true)
    setStep("saved")
    setTimeout(() => setStep("menu"), 1500)
  }

  async function handleFid(value: string) {
    const trimmed = value.trim()
    const newFid = trimmed ? parseInt(trimmed, 10) : null
    if (newFid !== null && isNaN(newFid)) {
      setInputEnabled(true)
      setStep("menu")
      return
    }
    const newConfig = { ...config!, fid: newFid }
    await saveConfig(newConfig)
    setConfig(newConfig)
    if (newFid) setAppFid(newFid)
    setInputEnabled(true)
    setStep("saved")
    setTimeout(() => setStep("menu"), 1500)
  }

  if (!config) return null

  return (
    <Box flexDirection="column" padding={1} gap={1}>
      <Text bold>Settings</Text>

      <Box flexDirection="column" gap={0}>
        <Box gap={1}>
          <Text>Hub URL:</Text>
          <Text color="cyan">{config.hubUrl}</Text>
        </Box>
        <Box gap={1}>
          <Text>FID:</Text>
          <Text color="cyan">{config.fid ?? "not set"}</Text>
        </Box>
        {hubInfo && (
          <Box gap={1}>
            <Text dimColor>
              Hub v{hubInfo.version} | {hubInfo.dbStats?.numMessages?.toLocaleString()} msgs |{" "}
              {hubInfo.dbStats?.numFidRegistrations?.toLocaleString()} FIDs
            </Text>
          </Box>
        )}
      </Box>

      {step === "menu" && (
        <Box flexDirection="column">
          <Text dimColor>Press h to change hub URL, f to set FID, q to go back</Text>
        </Box>
      )}

      {step === "hub-url" && (
        <Box gap={1}>
          <Text>New hub URL:</Text>
          <TextInput
            placeholder={config.hubUrl}
            onSubmit={handleHubUrl}
          />
        </Box>
      )}

      {step === "fid" && (
        <Box gap={1}>
          <Text>Your FID:</Text>
          <TextInput
            placeholder={String(config.fid ?? "")}
            onSubmit={handleFid}
          />
        </Box>
      )}

      {step === "saved" && (
        <StatusMessage variant="success">Settings saved!</StatusMessage>
      )}
    </Box>
  )
}

// Handle settings-specific keys in the parent app
export const SETTINGS_KEYS = {
  h: "hub-url",
  f: "fid",
} as const
