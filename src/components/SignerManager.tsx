import React, { useState, useEffect, useContext } from "react"
import { Box, Text, useInput } from "ink"
import { Spinner, StatusMessage } from "@inkjs/ui"
import { AppContext } from "../app.tsx"
import {
  loadSigners,
  removeSigner,
  setActiveSigner,
  type StoredSigner,
} from "../signer/store.ts"
import { clearSignerCache } from "../signer/sign.ts"

export function SignerManager() {
  const { navigate, inputEnabled, setFid } = useContext(AppContext)
  const [signers, setSigners] = useState<StoredSigner[]>([])
  const [activeKey, setActiveKey] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    refresh()
  }, [])

  async function refresh() {
    setLoading(true)
    const file = await loadSigners()
    setSigners(file.signers)
    setActiveKey(file.activeSignerPublicKey)
    setLoading(false)
  }

  useInput(
    (input, key) => {
      if (loading) return

      if (input === "j" || key.downArrow) {
        setSelectedIndex((i) => Math.min(i + 1, signers.length - 1))
      }
      if (input === "k" || key.upArrow) {
        setSelectedIndex((i) => Math.max(i - 1, 0))
      }
      if (key.return || input === "a") {
        const signer = signers[selectedIndex]
        if (signer) {
          setActiveSigner(signer.publicKey).then(() => {
            setActiveKey(signer.publicKey)
            setFid(signer.fid)
            clearSignerCache()
            setMessage(`Activated signer for FID ${signer.fid}`)
            setTimeout(() => setMessage(null), 2000)
          })
        }
      }
      if (input === "d") {
        const signer = signers[selectedIndex]
        if (signer) {
          removeSigner(signer.publicKey).then(() => {
            clearSignerCache()
            refresh()
            setMessage("Signer removed")
            setTimeout(() => setMessage(null), 2000)
          })
        }
      }
      if (input === "i") {
        navigate({ name: "signer-setup" })
      }
    },
    { isActive: inputEnabled }
  )

  if (loading) {
    return (
      <Box padding={1}>
        <Spinner label="Loading signers..." />
      </Box>
    )
  }

  return (
    <Box flexDirection="column" padding={1} gap={1}>
      <Text bold>Signer Manager</Text>

      {signers.length === 0 ? (
        <Box flexDirection="column">
          <Text dimColor>No signers configured.</Text>
          <Text dimColor>Press i to import a signer.</Text>
        </Box>
      ) : (
        <Box flexDirection="column">
          {signers.map((signer, i) => {
            const isActive = signer.publicKey === activeKey
            const isSelected = i === selectedIndex

            return (
              <Box
                key={signer.publicKey}
                gap={1}
                borderStyle={isSelected ? "bold" : undefined}
                borderColor={isSelected ? "cyan" : undefined}
                paddingX={isSelected ? 1 : 0}
              >
                <Text color={isActive ? "green" : "gray"}>
                  {isActive ? "[active]" : "       "}
                </Text>
                <Text bold={isSelected}>
                  {signer.label || "unnamed"}
                </Text>
                <Text dimColor>FID: {signer.fid}</Text>
                <Text dimColor>
                  {signer.publicKey.slice(0, 8)}...
                </Text>
                <Text dimColor>
                  {new Date(signer.createdAt).toLocaleDateString()}
                </Text>
              </Box>
            )
          })}
        </Box>
      )}

      {message && <StatusMessage variant="success">{message}</StatusMessage>}

      <Text dimColor>
        j/k:nav Enter/a:activate d:delete i:import new q:back
      </Text>
    </Box>
  )
}
