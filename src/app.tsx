import React, { useState, useEffect, useCallback, createContext } from "react"
import { Box, useInput, useApp } from "ink"
import { loadConfig } from "./config/store.ts"
import { setHubUrl, getHubUrl } from "./hub/client.ts"
import { Header } from "./components/Header.tsx"
import { Welcome } from "./components/Welcome.tsx"
import { Feed } from "./components/Feed.tsx"
import { Profile } from "./components/Profile.tsx"
import { Thread } from "./components/Thread.tsx"
import { Search } from "./components/Search.tsx"
import { Notifications } from "./components/Notifications.tsx"
import { Settings } from "./components/Settings.tsx"
import { SignerSetup } from "./components/SignerSetup.tsx"
import { SignerManager } from "./components/SignerManager.tsx"
import { CastComposer } from "./components/CastComposer.tsx"

export type Screen =
  | { name: "welcome" }
  | { name: "feed" }
  | { name: "profile"; fid: number }
  | { name: "thread"; castFid: number; castHash: string }
  | { name: "notifications" }
  | { name: "compose"; parentCastId?: { fid: number; hash: string } }
  | { name: "search" }
  | { name: "signer-setup" }
  | { name: "signer-manager" }
  | { name: "settings" }

interface AppContextType {
  navigate: (screen: Screen) => void
  goBack: () => void
  fid: number | null
  setFid: (fid: number) => void
  password: string | null
  setPassword: (p: string) => void
  inputEnabled: boolean
  setInputEnabled: (enabled: boolean) => void
}

export const AppContext = createContext<AppContextType>(null!)

export function App() {
  const { exit } = useApp()
  const [screen, setScreen] = useState<Screen>({ name: "welcome" })
  const [history, setHistory] = useState<Screen[]>([])
  const [fid, setFid] = useState<number | null>(null)
  const [password, setPassword] = useState<string | null>(null)
  const [inputEnabled, setInputEnabled] = useState(true)
  const [hubUrlState, setHubUrlState] = useState("https://hub.merv.fun")
  const [configLoaded, setConfigLoaded] = useState(false)

  useEffect(() => {
    loadConfig().then((config) => {
      setHubUrl(config.hubUrl)
      setHubUrlState(config.hubUrl)
      if (config.fid) {
        setFid(config.fid)
        setScreen({ name: "feed" })
      }
      setConfigLoaded(true)
    })
  }, [])

  const navigate = useCallback(
    (next: Screen) => {
      setHistory((prev) => [...prev, screen])
      setScreen(next)
    },
    [screen]
  )

  const goBack = useCallback(() => {
    if (history.length > 0) {
      setScreen(history[history.length - 1])
      setHistory((prev) => prev.slice(0, -1))
    }
  }, [history])

  // Global keybindings
  useInput(
    (input, key) => {
      // Quit
      if (input === "q") {
        if (history.length > 0) {
          goBack()
        } else {
          exit()
        }
        return
      }
      if (key.escape) {
        if (history.length > 0) {
          goBack()
        }
        return
      }

      // Screen navigation
      if (input === "1") {
        if (fid) navigate({ name: "feed" })
        return
      }
      if (input === "2") {
        if (fid) navigate({ name: "notifications" })
        return
      }
      if (input === "3") {
        navigate({ name: "search" })
        return
      }
      if (input === "4" && fid) {
        navigate({ name: "profile", fid })
        return
      }
      if (input === "n" && screen.name !== "compose" && screen.name !== "search") {
        navigate({ name: "compose" })
        return
      }
      if (input === "s" && screen.name !== "search") {
        navigate({ name: "signer-manager" })
        return
      }
      if (input === "?" && screen.name !== "settings") {
        navigate({ name: "settings" })
        return
      }

      // Settings-specific keys
      if (screen.name === "settings") {
        if (input === "h") {
          setInputEnabled(false)
        }
        if (input === "f") {
          setInputEnabled(false)
        }
      }
    },
    { isActive: inputEnabled && screen.name !== "welcome" }
  )

  const ctx: AppContextType = {
    navigate,
    goBack,
    fid,
    setFid,
    password,
    setPassword,
    inputEnabled,
    setInputEnabled,
  }

  if (!configLoaded) return null

  return (
    <AppContext.Provider value={ctx}>
      <Box flexDirection="column" width="100%">
        {screen.name !== "welcome" && (
          <Header
            currentScreen={screen.name}
            fid={fid}
            hubUrl={hubUrlState}
          />
        )}
        {screen.name === "welcome" && <Welcome />}
        {screen.name === "feed" && <Feed />}
        {screen.name === "profile" && <Profile fid={screen.fid} />}
        {screen.name === "thread" && (
          <Thread castFid={screen.castFid} castHash={screen.castHash} />
        )}
        {screen.name === "notifications" && <Notifications />}
        {screen.name === "search" && <Search />}
        {screen.name === "compose" && (
          <CastComposer parentCastId={screen.parentCastId} />
        )}
        {screen.name === "signer-setup" && <SignerSetup />}
        {screen.name === "signer-manager" && <SignerManager />}
        {screen.name === "settings" && <Settings />}
      </Box>
    </AppContext.Provider>
  )
}
