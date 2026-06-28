# Install opencode-usage (instructions for the OpenCode agent)

You are an OpenCode agent. The user pasted a link to this file so that you would
install the **opencode-usage** plugin for them. Do it now by following these
steps exactly, using your `bash` tool. Do not ask for confirmation unless a step
fails.

opencode-usage adds a `/usage` slash command. Typing `/usage` in the TUI shows
the user's token + cost usage broken down by today / this week / this month /
all-time, plus a per-model breakdown, read straight from OpenCode's own local
database.

## Step 1 - run the installer

Run this single command:

```sh
curl -fsSL https://raw.githubusercontent.com/anxkhn/opencode-usage/main/install.sh | bash
```

This copies two files into the user's OpenCode config
(`${XDG_CONFIG_HOME:-$HOME/.config}/opencode`):

- `usage.mjs` (the engine/CLI)
- `usage-plugin.ts` (the TUI plugin that registers the `/usage` command)

and declares the plugin in `tui.json` (required: TUI plugins are not
auto-discovered from a directory). It also removes any older AI-based
`command/usage.md` or `plugin/usage.ts` so they cannot interfere.

## Step 2 - verify

Run the engine directly to confirm it can read the database and produce a report
(this does not need the TUI):

```sh
node "${XDG_CONFIG_HOME:-$HOME/.config}/opencode/usage.mjs"
```

If it prints a usage table, the install worked.

## Step 3 - tell the user

Report success and tell them:

- Restart OpenCode (or start a new session) so the plugin loads.
- Type `/usage` in the TUI (also `/cost` or `/tokens`) to see the report.
- Optionally, `node ~/.config/opencode/usage.mjs [today|week|month|all|daily|models]`
  runs the same report from a terminal.

If `curl` is unavailable or Step 1 fails, fall back to installing manually: copy
`usage.mjs` and `usage-plugin.ts` from
`https://raw.githubusercontent.com/anxkhn/opencode-usage/main/<path>` into the
OpenCode config dir, `chmod +x` the `usage.mjs` file, and add `"./usage-plugin.ts"`
to the `"plugin"` array in `<config-dir>/tui.json` (create it if missing). Also
delete any existing `command/usage.md` or `plugin/usage.ts` in the config dir.
