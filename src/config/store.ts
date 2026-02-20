import { mkdir, readFile, writeFile } from "node:fs/promises"
import { homedir } from "node:os"
import { join } from "node:path"

export interface Config {
  hubUrl: string
  fid: number | null
}

const CONFIG_DIR = join(homedir(), ".config", "farcaster-tui")
const CONFIG_PATH = join(CONFIG_DIR, "config.json")

const DEFAULT_CONFIG: Config = {
  hubUrl: "https://hub.merv.fun",
  fid: null,
}

export async function loadConfig(): Promise<Config> {
  try {
    const data = await readFile(CONFIG_PATH, "utf-8")
    return { ...DEFAULT_CONFIG, ...JSON.parse(data) }
  } catch {
    return { ...DEFAULT_CONFIG }
  }
}

export async function saveConfig(config: Config): Promise<void> {
  await mkdir(CONFIG_DIR, { recursive: true })
  await writeFile(CONFIG_PATH, JSON.stringify(config, null, 2))
}
