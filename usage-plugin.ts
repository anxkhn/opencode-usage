// SPDX-License-Identifier: GPL-3.0-or-later
// opencode-usage TUI plugin.
//
// Registers a `/usage` slash command. Typing `/usage` in the TUI runs `onSelect`
// directly (the same mechanism behind built-in commands like /models and /help)
// and shows the report in a dialog, read from OpenCode's local database.
//
// IMPORTANT: TUI plugins are not auto-discovered from the plugin/ directory.
// This file must be referenced from `tui.json` (the installer does that):
//   { "plugin": ["./usage-plugin.ts"] }
//
// The computation lives in ./usage.mjs (also usable as a CLI).

import type { TuiPlugin } from "@opencode-ai/plugin/tui"
import { buildReport, dbPath, loadMessages } from "./usage.mjs"

const tui: TuiPlugin = async (api) => {
  // `api.command` is the supported way for a plugin to add a slash command.
  const register = api.command?.register
  if (!register) return

  register(() => [
    {
      title: "Usage",
      value: "usage.show",
          description: "Show your OpenCode token + cost usage",
      category: "Usage",
      suggested: true,
      slash: { name: "usage", aliases: ["cost", "tokens"] },
      async onSelect(dialog) {
        const stack = dialog ?? api.ui.dialog

        let report: string
        try {
          const messages = await loadMessages()
          report = buildReport(messages, { period: "summary", now: Date.now() })
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err)
          report = `Could not read OpenCode usage.\n\nDatabase: ${dbPath()}\nError: ${message}`
        }

        stack.setSize?.("large")
        stack.replace(() =>
          api.ui.DialogAlert({
            title: "OpenCode Usage",
            message: report,
            onConfirm: () => stack.clear(),
          }),
        )
      },
    },
  ])
}

export default { id: "opencode-usage", tui }
