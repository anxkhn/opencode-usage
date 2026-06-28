// Verifies the TUI plugin registers a `/usage` slash command and that selecting
// it builds the usage report and renders it in a dialog, using a mock host API
// (no real TUI required). Run with: node test/plugin.test.mjs
//
// This exercises the same code path the OpenCode TUI uses, minus the on-screen
// rendering, so it catches breakage in registration and report generation.

import assert from "node:assert/strict"
import plugin from "../usage-plugin.ts"

function makeMockApi() {
  const state = { commands: [], replace: 0, clear: 0, size: null, rendered: null }

  const dialog = {
    replace(render) {
      state.replace++
      state.rendered = render()
    },
    clear() {
      state.clear++
    },
    setSize(s) {
      state.size = s
    },
    size: "medium",
    depth: 0,
    open: false,
  }

  const api = {
    command: {
      register(cb) {
        state.commands.push(...cb())
        return () => {}
      },
      trigger() {},
      show() {},
    },
    ui: {
      dialog,
      DialogAlert(props) {
        return { kind: "DialogAlert", ...props }
      },
      toast() {},
    },
  }

  return { api, state }
}

const { api, state } = makeMockApi()

// 1. Activating the plugin registers exactly one slash command named "usage".
await plugin.tui(api, undefined, {})
assert.equal(state.commands.length, 1, "should register one command")

const cmd = state.commands[0]
assert.equal(cmd.slash?.name, "usage", "command must be reachable as /usage")
assert.equal(typeof cmd.onSelect, "function", "command must have an onSelect handler")

// 2. Selecting it (what typing /usage does) renders a dialog with the report.
await cmd.onSelect(api.ui.dialog)
assert.equal(state.replace, 1, "onSelect should open a dialog")
assert.equal(state.size, "large", "dialog should be widened for the table")

const el = state.rendered
assert.equal(el.kind, "DialogAlert", "should render a DialogAlert")
assert.equal(el.title, "OpenCode Usage")
assert.match(el.message, /OpenCode Usage/, "report header present")
assert.match(el.message, /All Time/, "report includes the all-time window")
assert.match(el.message, /\$\d/, "report includes a cost figure")

console.log("ok - /usage registers and renders the report")
console.log("---- sample dialog content ----")
console.log(el.message)
