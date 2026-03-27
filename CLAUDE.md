# Subtitle Blocker - Claude Code Guidelines

## Workflow Expectations

- When building desktop apps (Electron, etc.), always clarify with the user whether they want the code built locally or on a remote server. If on a remote server, explicitly explain how to clone and run it locally before finishing.

## Build & Tasks

- Avoid running background tasks (e.g., icon generation, asset processing) that produce file changes during active development. Complete such tasks synchronously or run them before committing.
- For Electron apps, always verify the build toolchain (npm, node, electron-builder) is available in the current environment before attempting to build or package. If missing, flag it immediately rather than proceeding.
