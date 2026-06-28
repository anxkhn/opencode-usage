#!/usr/bin/env bash
# opencode-usage installer.
#
# Installs a `/usage` slash command into your OpenCode config. Typing /usage in
# the TUI shows your token + cost usage, read from OpenCode's local database.
# Safe to re-run (idempotent).
#
#   curl -fsSL https://raw.githubusercontent.com/anxkhn/opencode-usage/main/install.sh | bash
#
# Or from a local clone:
#
#   ./install.sh

set -euo pipefail

REPO_RAW="https://raw.githubusercontent.com/anxkhn/opencode-usage/main"
CFG="${XDG_CONFIG_HOME:-$HOME/.config}/opencode"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" >/dev/null 2>&1 && pwd)"

say() { printf '%s\n' "$*"; }

# Copy from a local clone when available, otherwise download from GitHub.
place() {
  src="$1" dst="$2"
  mkdir -p "$(dirname "$dst")"
  if [ -f "$SCRIPT_DIR/$src" ]; then
    cp "$SCRIPT_DIR/$src" "$dst"
  else
    curl -fsSL "$REPO_RAW/$src" -o "$dst"
  fi
}

say "Installing opencode-usage into $CFG"
mkdir -p "$CFG"
place usage.mjs       "$CFG/usage.mjs"
place usage-plugin.ts "$CFG/usage-plugin.ts"
chmod +x "$CFG/usage.mjs"

# Remove artifacts from earlier versions so they cannot interfere.
rm -f "$CFG/command/usage.md" "$CFG/plugin/usage.ts"
rmdir "$CFG/command" "$CFG/plugin" 2>/dev/null || true

# TUI plugins are NOT auto-discovered from a directory: they must be declared in
# tui.json. Merge our entry into the user's tui config without clobbering it.
CFG="$CFG" node - <<'NODE'
const fs = require("fs")
const path = require("path")
const cfgDir = process.env.CFG
const entry = "./usage-plugin.ts"

// Prefer an existing tui.jsonc, then tui.json, else create tui.json.
const candidates = ["tui.jsonc", "tui.json"].map((f) => path.join(cfgDir, f))
let file = candidates.find((f) => fs.existsSync(f)) || path.join(cfgDir, "tui.json")

let cfg = {}
if (fs.existsSync(file)) {
  const raw = fs.readFileSync(file, "utf8")
  try {
    // Tolerate JSONC: strip // and /* */ comments before parsing.
    const stripped = raw
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/(^|[^:])\/\/.*$/gm, "$1")
    cfg = JSON.parse(stripped || "{}")
  } catch (e) {
    console.error(`opencode-usage: could not parse ${file}.`)
    console.error(`Add ${JSON.stringify(entry)} to its "plugin" array manually.`)
    process.exit(0)
  }
}

cfg.plugin = Array.isArray(cfg.plugin) ? cfg.plugin : []
if (!cfg.plugin.includes(entry)) cfg.plugin.push(entry)
if (!cfg["$schema"]) cfg["$schema"] = "https://opencode.ai/tui.json"

fs.writeFileSync(file, JSON.stringify(cfg, null, 2) + "\n")
console.log("Declared the plugin in " + file)
NODE

say ""
say "Done."
say ""
say "  In the OpenCode TUI:  /usage        (also /cost or /tokens)"
say "  In a terminal:        node $CFG/usage.mjs   [today|week|month|all|daily|models]"
say ""
say "Restart OpenCode (fully quit and reopen) so it loads the plugin."
