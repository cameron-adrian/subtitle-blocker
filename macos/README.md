# Subtitle Blocker — native macOS (Swift/AppKit)

A menu-bar app that places a draggable, resizable rectangle over subtitles in
any video — browser tabs, local players, streaming services.

## Requirements

- macOS 13 Ventura or later
- Xcode Command Line Tools (`xcode-select --install`) **or** full Xcode

## Building

```bash
cd macos

# Quick run (builds + creates .app + opens it)
make run

# Build only
make bundle

# Clean
make clean
```

The `.app` bundle is created in `macos/SubtitleBlocker.app`.

## Usage

| Action | How |
|--------|-----|
| Show/hide blocker | `⌘⇧H` or menu-bar icon |
| Open settings | `⌘⇧S` or "Settings…" in menu |
| Move blocker | Click-drag the rectangle |
| Resize | Drag any edge or corner |
| Quit | `⌘⇧Q` or "Quit" in menu |

## Architecture

```
Sources/SubtitleBlocker/
├── main.swift                     Entry point
├── AppDelegate.swift              App lifecycle, status bar, wires everything together
├── Models.swift                   Profile, AppState (Codable)
├── ProfileManager.swift           JSON persistence in ~/Library/Application Support
├── OverlayWindowController.swift  NSPanel at screenSaver level
├── BlockerView.swift              Draggable/resizable NSView + PassthroughView
├── SettingsWindowController.swift Programmatic settings UI (no XIB)
└── ShortcutManager.swift          Carbon RegisterEventHotKey — no permissions needed
```

**No third-party dependencies.**

## Profiles

Saved to `~/Library/Application Support/SubtitleBlocker/profiles.json`.
Format is compatible with the Electron version's profile structure.

## macOS fullscreen overlay — known limitations

Apple does not expose a fully supported API for overlaying every fullscreen
application. This app uses a combination that works on macOS 13+ for the vast
majority of cases:

| Scenario | Works? | Notes |
|----------|--------|-------|
| Browser video (YouTube, Netflix, etc.) | ✅ | `.screenSaver` level covers these |
| Local players (IINA, VLC) — windowed | ✅ | |
| Local players — native fullscreen | ⚠️ | Depends on player's window level |
| Safari Picture-in-Picture | ❌ | Runs at a privileged system level |
| Screen recording / AirPlay | ❌ | System-reserved levels |

If an app appears **above** the blocker, try reducing the video player to a
large window rather than true fullscreen — the overlay will work reliably there.

## Possible improvements (not implemented)

- **System Extension / Screen Recording permission**: With `com.apple.security.screen-recording`
  entitlement and a ScreenCaptureKit overlay, you can draw above everything — but
  requires App Store review or notarisation with that entitlement.
- **Accessibility overlay via AXUIElement**: Can attach to specific app windows and
  follow them, but has permission overhead.
- **Multiple-screen support**: Overlay currently covers `NSScreen.main`; could be
  extended with per-screen controllers.
- **Menu bar icon with indicator**: Tint the icon red when blocker is hidden.
- **Import Electron profiles**: The JSON schema is compatible; a small import button
  in Settings could read the Electron `profiles.json` directly.
