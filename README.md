# Subtitle Blocker

A desktop overlay app that blocks subtitles on any video player. Works on top of fullscreen apps.

## Features

- **Always-on-top overlay** - Persists over fullscreen video players and apps
- **Drag and drop** - Move the blocker anywhere on screen
- **Resizable** - Drag edges/corners to fit any subtitle area
- **Profile system** - Save position/size per video source (e.g., "YouTube - ChannelName")
- **Adjustable opacity** - From barely visible to fully opaque
- **Custom color** - Pick any blocker color
- **System tray** - Runs in the background with quick access menu
- **Keyboard shortcuts** - Toggle visibility, open settings, quit

## Install

```bash
npm install
npm start
```

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+Shift+H` | Toggle blocker visibility |
| `Ctrl+Shift+S` | Open settings |
| `Ctrl+Shift+Q` | Quit |

## How It Works

The app creates a fullscreen transparent window that stays on top of everything. Inside it, an opaque rectangle (the blocker) covers the subtitle area. The rest of the window is click-through so you can interact with apps underneath normally.

Profiles let you save blocker positions per video source. For example, if a YouTube channel always has hardcoded subtitles in the same spot, save a profile for it and load it whenever you watch that channel.
