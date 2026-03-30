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

---

> **Two ways to run this app:**
> - **Development mode** — run it directly from the source code using a terminal. The terminal must stay open while the app runs. Good for trying it out.
> - **Build an installable app** — compile it into a proper `.app` (Mac), `.exe` (Windows), or `.AppImage` (Linux) that you can install and launch like any other program. This is what you want for everyday use.
>
> Both are covered below.

---

## Table of Contents

1. [Step 1 — Install Node.js](#step-1--install-nodejs)
2. [Step 2 — Get the Code](#step-2--get-the-code)
3. [Step 3 — Install Dependencies](#step-3--install-dependencies)
4. [Step 4 — Run the App](#step-4--run-the-app)
5. [macOS: "App Can't Be Opened" Warning](#macos-app-cant-be-opened-warning)
6. [Keyboard Shortcuts](#keyboard-shortcuts)
7. [Troubleshooting](#troubleshooting)
8. [How It Works](#how-it-works)

---

## Step 1 — Install Node.js

Node.js is a runtime that lets your computer run this app's code. It comes bundled with npm (Node Package Manager), the tool that downloads the app's dependencies. You only need to install this once.

1. Go to **https://nodejs.org** and download the **LTS** version. (LTS stands for Long-Term Support — it's the stable, recommended version.)

2. Run the installer:
   - On **macOS**: open the downloaded `.pkg` file and follow the prompts. Accept all defaults.
   - On **Windows**: open the downloaded `.msi` file and follow the prompts. Accept all defaults — make sure "Add to PATH" is checked (it is by default).

3. Open a terminal:
   - **macOS**: press `Cmd + Space` to open Spotlight, type `Terminal`, and press Enter.
   - **Windows**: press the Windows key, type `PowerShell`, and press Enter.
   - **Linux**: press `Ctrl + Alt + T` on most distros.

4. Verify Node.js installed correctly. Type the following and press Enter:

   ```
   node --version
   ```

   You should see something like `v22.x.x`. If you get a "command not found" error, see [Troubleshooting](#troubleshooting).

5. Verify npm is available:

   ```
   npm --version
   ```

   You should see something like `10.x.x`.

> **Windows users:** If you get "command not found" after installing Node.js, close and reopen PowerShell. The terminal needs to restart to pick up the new installation.

---

## Step 2 — Get the Code

You need a copy of the project files on your computer. Choose one of the two options below.

### Option A — Using Git (recommended)

Git is a tool for downloading and keeping code up to date. If you're not sure whether you have it, check first:

```
git --version
```

If you see a version number, you're good. If you get "command not found", download Git from **https://git-scm.com/downloads**, install it, and then reopen your terminal.

Once git is available:

1. In your terminal, navigate to where you want the project folder to live. For example, to put it on your Desktop:

   ```
   cd Desktop
   ```

2. Download the project:

   ```
   git clone https://github.com/cameron-adrian/subtitle-blocker.git
   ```

   This creates a `subtitle-blocker` folder wherever you ran the command.

3. Enter the project folder:

   ```
   cd subtitle-blocker
   ```

### Option B — Download a ZIP (no git required)

1. Go to the project page on GitHub: **https://github.com/cameron-adrian/subtitle-blocker**
2. Click the green **Code** button, then click **Download ZIP**.
3. Find the downloaded `.zip` file (usually in your Downloads folder) and double-click it to extract.
4. Open your terminal and navigate into the extracted folder. For example:

   - **macOS:**
     ```
     cd ~/Downloads/subtitle-blocker-main
     ```
   - **Windows:**
     ```
     cd C:\Users\YourName\Downloads\subtitle-blocker-main
     ```

   Replace `YourName` with your actual Windows username.

---

## Step 3 — Install Dependencies

This step downloads the libraries the app needs (including the Electron framework) into a local folder called `node_modules`. It does not install anything system-wide.

Make sure you are inside the `subtitle-blocker` folder (from Step 2), then run:

```
npm install
```

This can take **1–3 minutes** and will print a lot of text. That is normal. As long as it does not end with a line starting with `npm error`, it worked.

You should see: a message like `added 400 packages` at the end. A `node_modules` folder will appear in the project — you don't need to touch it.

---

## Step 4 — Run the App

You have two options. Pick whichever fits your needs.

---

### Option A — Run in Development Mode (quickest)

```
npm start
```

You should see: the Subtitle Blocker overlay appear on your screen — a dark rectangle near the bottom.

> **Note:** The terminal window must stay open while the app is running. Closing the terminal stops the app. This is expected in development mode. If you want the app to work like a normal double-click application, use Option B below.

---

### Option B — Build an Installable App

This compiles the app into a proper installable file. Run the command for your operating system:

- **macOS:**
  ```
  npm run dist:mac
  ```

- **Windows:**
  ```
  npm run dist:win
  ```

- **Linux:**
  ```
  npm run dist:linux
  ```

> This step downloads additional tools and can take **5–10 minutes** the first time. You'll see a lot of output — that's normal.

When it finishes, look inside the `dist/` folder that appears in your project directory.

**Installing the built app:**

- **macOS:** Open the `.dmg` file in `dist/`. Drag the **Subtitle Blocker** app into your Applications folder. Eject the disk image. Launch it from Applications or Spotlight.
- **Windows:** Run the installer `.exe` inside `dist/`. Follow the prompts. The app will be added to your Start menu.
- **Linux:** Find the `.AppImage` file in `dist/`. Before running it, make it executable:
  ```
  chmod +x Subtitle-Blocker-*.AppImage
  ```
  Then double-click it or run it directly. No installation needed.

---

## macOS: "App Can't Be Opened" Warning

> **If you see this message:** *"Subtitle Blocker.app" can't be opened because Apple cannot check it for malicious software.*

This is expected. macOS has a security feature called Gatekeeper that blocks apps from developers who haven't paid for an Apple code-signing certificate. This app is not signed, so macOS shows a warning the first time. You only need to bypass it once.

### Method 1 — Right-click trick (easiest)

1. **Do not** double-click the app. Instead, **right-click** on it (or hold Control and click).
2. Choose **Open** from the menu.
3. A new dialog appears with an **Open** button. Click it.
4. The app opens. From now on, double-click will work normally.

### Method 2 — System Settings

1. Try to double-click the app. It will be blocked.
2. Open **System Settings** → **Privacy & Security**.
3. Scroll down to the **Security** section. You'll see a message saying the app was blocked, with an **"Open Anyway"** button.
4. Click **Open Anyway**, then confirm in the next dialog.

> **Windows users:** Windows Defender may show a "Windows protected your PC" SmartScreen warning when running the installer. Click **More info**, then **Run anyway**.

---

## Keyboard Shortcuts

These shortcuts are **global** — they work even when the Subtitle Blocker window is not focused, so you don't need to click the app to use them.

| Shortcut | Action |
|---|---|
| `Ctrl+Shift+H` | Toggle blocker visibility |
| `Ctrl+Shift+S` | Open settings |
| `Ctrl+Shift+Q` | Quit |

> **macOS users:** Use `Cmd` in place of `Ctrl` for these shortcuts.

---

## Troubleshooting

**"command not found: npm" or "npm is not recognized"**

Node.js is not installed or was not added to your system PATH. Go back to [Step 1](#step-1--install-nodejs). On Windows, close and reopen your terminal after installing. If the problem persists, reinstall Node.js and make sure "Add to PATH" is checked during installation (it is checked by default).

---

**"EACCES: permission denied" during npm install (macOS/Linux)**

Do not run `sudo npm install` — it can cause permission problems that are hard to undo. Instead, follow the official guide for fixing npm permissions: https://docs.npmjs.com/resolving-eacces-permissions-errors-when-installing-packages-globally

---

**"Cannot find module 'electron'" or similar module errors**

The `npm install` step did not complete successfully. Delete the `node_modules` folder and run `npm install` again.

- **macOS/Linux:**
  ```
  rm -rf node_modules && npm install
  ```
- **Windows:** Manually delete the `node_modules` folder in File Explorer, then run `npm install` again.

---

**The app window appears behind other windows / I can't interact with windows underneath**

On macOS, the app needs Accessibility permissions to stay on top of other windows. Go to **System Settings → Privacy & Security → Accessibility** and make sure **Terminal** (for dev mode) or **Subtitle Blocker** (for the installed app) is listed and toggled on.

---

**"npm run dist:mac" fails with an error about icon.png**

The `build/icon.png` file is missing. If you downloaded the ZIP, try re-downloading it — the file may not have extracted correctly. If you used git, run:

```
git status
```

and confirm `build/icon.png` is present.

---

**The built app crashes immediately on macOS**

Electron 33 (used by this app) requires **macOS 10.15 Catalina or later**. Check your macOS version in **Apple menu → About This Mac**.

---

## How It Works

The app creates a fullscreen transparent window that stays on top of everything. Inside it, an opaque rectangle (the blocker) covers the subtitle area. The rest of the window is click-through so you can interact with apps underneath normally.

Profiles let you save blocker positions per video source. For example, if a YouTube channel always has hardcoded subtitles in the same spot, save a profile for it and load it whenever you watch that channel.
