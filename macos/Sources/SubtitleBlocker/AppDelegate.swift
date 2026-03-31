import AppKit

// MARK: - AppDelegate

final class AppDelegate: NSObject, NSApplicationDelegate {

    // MARK: Controllers

    private var overlayWC   = OverlayWindowController()
    private var settingsWC  = SettingsWindowController()

    // MARK: Status bar

    private var statusItem: NSStatusItem!

    // MARK: App lifecycle

    func applicationDidFinishLaunching(_ notification: Notification) {
        // No Dock icon — this is a menu-bar-only app.
        NSApp.setActivationPolicy(.accessory)

        setupStatusBar()
        setupSettingsCallbacks()
        ShortcutManager.shared.register()

        // Show the overlay immediately.
        overlayWC.show()

        // Apply the last used profile if one was saved.
        if let profile = ProfileManager.shared.lastProfile {
            overlayWC.apply(profile: profile)
            settingsWC.syncAppearance(opacity: profile.opacity,
                                      color: profile.color.nsColor)
        }

        // Respond to hotkeys.
        NotificationCenter.default.addObserver(self,
            selector: #selector(handleToggle),
            name: .toggleBlocker, object: nil)
        NotificationCenter.default.addObserver(self,
            selector: #selector(handleShowSettings),
            name: .showSettings, object: nil)

        // Keep overlay covering the correct screen on display changes.
        NotificationCenter.default.addObserver(self,
            selector: #selector(screensChanged),
            name: NSApplication.didChangeScreenParametersNotification, object: nil)
    }

    func applicationWillTerminate(_ notification: Notification) {
        ShortcutManager.shared.unregisterAll()
    }

    // MARK: Status bar setup

    private func setupStatusBar() {
        statusItem = NSStatusBar.system.statusItem(withLength: NSStatusItem.squareLength)
        if let btn = statusItem.button {
            // Use a template image so it adapts to light/dark menu bar.
            btn.image = NSImage(systemSymbolName: "rectangle.slash",
                                accessibilityDescription: "Subtitle Blocker")
            btn.image?.isTemplate = true
            btn.action = #selector(statusBarClicked(_:))
            btn.target = self
            btn.sendAction(on: [.leftMouseUp, .rightMouseUp])
        }
        statusItem.menu = buildMenu()
    }

    private func buildMenu() -> NSMenu {
        let menu = NSMenu()
        menu.addItem(NSMenuItem(title: "Show / Hide Blocker",
                                action: #selector(handleToggle), keyEquivalent: ""))
        menu.addItem(NSMenuItem(title: "Settings…",
                                action: #selector(handleShowSettings), keyEquivalent: ""))
        menu.addItem(.separator())
        menu.addItem(NSMenuItem(title: "Quit Subtitle Blocker",
                                action: #selector(NSApplication.terminate(_:)),
                                keyEquivalent: ""))
        // All items target self.
        menu.items.forEach { $0.target = self }
        return menu
    }

    // MARK: Settings callbacks

    private func setupSettingsCallbacks() {
        settingsWC.onLoadProfile = { [weak self] name in
            guard let self else { return }
            guard let profile = ProfileManager.shared.profile(named: name) else { return }
            self.overlayWC.apply(profile: profile)
            self.settingsWC.syncAppearance(opacity: profile.opacity, color: profile.color.nsColor)
            ProfileManager.shared.lastProfileName = name
        }

        settingsWC.onSaveProfile = { [weak self] name in
            guard let self else { return }
            // Capture current overlay state into a profile.
            let current = self.overlayWC.currentProfile(merging: .default)
            ProfileManager.shared.save(profile: current, named: name)
            ProfileManager.shared.lastProfileName = name
            self.refreshSettingsProfiles(selecting: name)
        }

        settingsWC.onDeleteProfile = { [weak self] name in
            guard let self else { return }
            ProfileManager.shared.delete(named: name)
            self.refreshSettingsProfiles()
        }

        settingsWC.onOpacityChange = { [weak self] opacity in
            self?.overlayWC.setOpacity(opacity)
        }

        settingsWC.onColorChange = { [weak self] color in
            self?.overlayWC.setColor(color)
        }
    }

    private func refreshSettingsProfiles(selecting name: String? = nil) {
        settingsWC.refreshProfiles(
            names: ProfileManager.shared.profileNames,
            selecting: name ?? ProfileManager.shared.lastProfileName
        )
    }

    // MARK: Actions

    @objc private func statusBarClicked(_ sender: NSStatusBarButton) {
        // Left-click toggles; right-click shows the menu (handled by NSStatusItem).
        if let event = NSApp.currentEvent, event.type == .leftMouseUp {
            handleToggle()
        }
    }

    @objc func handleToggle() {
        overlayWC.toggleVisibility()
        // Refresh the menu title to reflect current state.
        if let menu = statusItem.menu,
           let item = menu.item(at: 0) {
            item.title = overlayWC.isVisible ? "Hide Blocker" : "Show Blocker"
        }
    }

    @objc func handleShowSettings() {
        refreshSettingsProfiles()
        // Sync live appearance state.
        let profile = overlayWC.currentProfile(merging: .default)
        settingsWC.syncAppearance(opacity: profile.opacity, color: profile.color.nsColor)
        settingsWC.window?.center()
        settingsWC.window?.makeKeyAndOrderFront(nil)
        NSApp.activate(ignoringOtherApps: true)
    }

    @objc private func screensChanged() {
        overlayWC.screenDidChange()
    }
}
