# Subtitle Blocker

A cross-browser WebExtension that covers burned-in subtitles with a draggable,
resizable rectangle. No OCR, no stream interception — just a simple visual
block you position over the subtitle area of any video player.

Works on Firefox and Chrome (Manifest V3).

## Features

- Drag-and-drop the blocker anywhere in the page viewport
- Resize from any edge or corner (8 handles)
- Persists through HTML5 fullscreen (YouTube, Netflix, generic `<video>`, etc.)
- Click-through: clicks outside the blocker rectangle still reach the page, so
  video controls keep working
- Saved profiles for quick recall (stored in `browser.storage.local`)
- Adjustable opacity and color

## Install (developer / unpacked)

### Firefox

1. Open `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on…**
3. Select `manifest.json` from this repo
4. Or run `npm install && npm run dev` to launch a throwaway Firefox with
   the extension pre-loaded

### Chrome / Edge / Brave

1. Open `chrome://extensions`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked** and select the repo root

## Usage

1. Click the Subtitle Blocker toolbar icon to open the popup.
2. The black rectangle appears near the bottom of the page — drag it over the
   subtitle area of your video.
3. Resize by dragging any edge/corner.
4. Save the current position/size as a profile so you can recall it later.
5. Enter fullscreen on the video — the overlay follows automatically.

Opacity and color are live-editable from the popup.

## Limitations

- **Cross-origin iframes**: The content script does not inject into foreign
  frames (`all_frames: false`), so embedded players hosted on a different
  origin won't be covered. Major streaming sites render video in the top
  frame, so this is usually fine.
- **Non-HTML5 players**: Flash, Silverlight, etc. can't be overlaid by a
  content script. HTML5 `<video>` is supported.
- **Keyboard shortcuts**: Not implemented yet. Toggle visibility from the
  popup.
- **System-wide coverage**: A browser extension can only affect browser tabs.
  If you need an OS-level overlay (for a native video player), check the git
  history for the prior Electron / macOS Swift implementations.

## Develop

```sh
npm install
npm run dev           # launch Firefox with the extension loaded + live reload
npm run dev:chromium  # same, but Chromium
npm run lint          # web-ext lint
npm run build         # produces a .zip in web-ext-artifacts/
```

## Project layout

```
manifest.json              MV3 manifest
src/
  background.js            minimal service worker
  content/
    content.js             injects shadow-DOM overlay; drag/resize/fullscreen
    overlay.css            overlay styles (loaded into shadow root)
  popup/
    popup.html/js/css      toolbar popup UI
  lib/
    api.js                 browser/chrome unification
    constants.js           defaults + message types
    profiles.js            storage.local CRUD
icons/
  icon.png                 512x512 icon (browser scales for all sizes)
```
