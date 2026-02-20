#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const entry = join(__dirname, "..", "src", "index.tsx");

try {
  execFileSync("bun", [entry], { stdio: "inherit" });
} catch (e) {
  if (e.status !== null) process.exit(e.status);
  console.error(
    "farcaster-tui requires Bun to run. Install it: https://bun.sh"
  );
  process.exit(1);
}
