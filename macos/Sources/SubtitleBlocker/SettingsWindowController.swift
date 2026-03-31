import AppKit

// MARK: - SettingsWindowController

/// Programmatic settings window — no XIB/storyboard.
/// Mirrors the three sections of the Electron settings UI:
///   1. Profiles   2. Appearance   3. Keyboard shortcuts
final class SettingsWindowController: NSWindowController {

    // References to controls that need live updates.
    private var profilePopUp   = NSPopUpButton()
    private var nameField      = NSTextField()
    private var opacitySlider  = NSSlider()
    private var opacityLabel   = NSTextField()
    private var colorWell      = NSColorWell()

    // Callbacks to AppDelegate.
    var onLoadProfile:  ((String) -> Void)?
    var onSaveProfile:  ((String) -> Void)?
    var onDeleteProfile:((String) -> Void)?
    var onOpacityChange:((CGFloat) -> Void)?
    var onColorChange:  ((NSColor) -> Void)?

    // Provides live state from the overlay for "save current" operations.
    var currentOpacity: CGFloat = 0.85
    var currentColor:   NSColor = .black

    // MARK: Init

    init() {
        let win = NSWindow(
            contentRect: NSRect(x: 0, y: 0, width: 380, height: 480),
            styleMask: [.titled, .closable, .miniaturizable],
            backing: .buffered,
            defer: false
        )
        win.title = "Subtitle Blocker"
        win.isReleasedWhenClosed = false
        super.init(window: win)
        win.delegate = self
        buildUI(in: win)
    }
    required init?(coder: NSCoder) { fatalError("not implemented") }

    // MARK: Build UI

    private func buildUI(in win: NSWindow) {
        let root = NSStackView()
        root.orientation    = .vertical
        root.spacing        = 20
        root.edgeInsets     = NSEdgeInsets(top: 20, left: 20, bottom: 20, right: 20)
        root.translatesAutoresizingMaskIntoConstraints = false

        root.addArrangedSubview(makeProfileSection())
        root.addArrangedSubview(makeSeparator())
        root.addArrangedSubview(makeAppearanceSection())
        root.addArrangedSubview(makeSeparator())
        root.addArrangedSubview(makeShortcutsSection())

        win.contentView = root
        NSLayoutConstraint.activate([
            root.topAnchor.constraint(equalTo: win.contentView!.topAnchor),
            root.leadingAnchor.constraint(equalTo: win.contentView!.leadingAnchor),
            root.trailingAnchor.constraint(equalTo: win.contentView!.trailingAnchor),
            root.bottomAnchor.constraint(lessThanOrEqualTo: win.contentView!.bottomAnchor),
        ])
    }

    // MARK: Sections

    private func makeProfileSection() -> NSView {
        let stack = labeledSection(title: "Profiles")

        // Pop-up + Load row
        profilePopUp.controlSize = .regular
        profilePopUp.autoresizingMask = [.width]
        profilePopUp.target = self
        profilePopUp.action = #selector(profileSelected(_:))

        let loadBtn   = button("Load",   action: #selector(loadProfile))
        let deleteBtn = button("Delete", action: #selector(deleteProfile))
        deleteBtn.contentTintColor = NSColor.systemRed

        let row1 = hstack([profilePopUp, loadBtn, deleteBtn])
        stack.addArrangedSubview(row1)

        // Save row
        nameField.placeholderString = "Profile name…"
        nameField.controlSize = .regular
        let saveBtn = button("Save", action: #selector(saveProfile))
        let row2 = hstack([nameField, saveBtn])
        stack.addArrangedSubview(row2)

        return stack
    }

    private func makeAppearanceSection() -> NSView {
        let stack = labeledSection(title: "Appearance")

        // Opacity slider
        opacitySlider.minValue      = 0.1
        opacitySlider.maxValue      = 1.0
        opacitySlider.numberOfTickMarks = 0
        opacitySlider.isContinuous  = true
        opacitySlider.doubleValue   = Double(currentOpacity)
        opacitySlider.target        = self
        opacitySlider.action        = #selector(opacityChanged(_:))

        opacityLabel = label("")
        updateOpacityLabel()

        let row1 = hstack([label("Opacity"), opacitySlider, opacityLabel])
        stack.addArrangedSubview(row1)

        // Color well
        colorWell.color  = currentColor
        colorWell.target = self
        colorWell.action = #selector(colorChanged(_:))
        colorWell.translatesAutoresizingMaskIntoConstraints = false
        NSLayoutConstraint.activate([
            colorWell.widthAnchor.constraint(equalToConstant: 44),
            colorWell.heightAnchor.constraint(equalToConstant: 28),
        ])

        let row2 = hstack([label("Color"), colorWell, NSView()])
        stack.addArrangedSubview(row2)

        return stack
    }

    private func makeShortcutsSection() -> NSView {
        let stack = labeledSection(title: "Keyboard Shortcuts")
        let shortcuts: [(String, String)] = [
            ("Toggle blocker",   "⌘ ⇧ H"),
            ("Open settings",    "⌘ ⇧ S"),
            ("Quit",             "⌘ ⇧ Q"),
        ]
        for (name, key) in shortcuts {
            let row = hstack([label(name), NSView(), monoLabel(key)])
            stack.addArrangedSubview(row)
        }
        return stack
    }

    // MARK: Actions

    @objc private func profileSelected(_ sender: NSPopUpButton) {
        // Keeps name field in sync for easy save-over.
        nameField.stringValue = sender.titleOfSelectedItem ?? ""
    }

    @objc private func loadProfile() {
        guard let name = profilePopUp.titleOfSelectedItem, !name.isEmpty else { return }
        nameField.stringValue = name
        onLoadProfile?(name)
    }

    @objc private func saveProfile() {
        let name = nameField.stringValue.trimmingCharacters(in: .whitespaces)
        guard !name.isEmpty else { return shake(nameField) }
        onSaveProfile?(name)
    }

    @objc private func deleteProfile() {
        guard let name = profilePopUp.titleOfSelectedItem, !name.isEmpty else { return }
        let alert = NSAlert()
        alert.messageText = "Delete \"\(name)\"?"
        alert.addButton(withTitle: "Delete").keyEquivalent = "\r"
        alert.addButton(withTitle: "Cancel").keyEquivalent = "\u{1b}"
        alert.alertStyle = .warning
        guard alert.runModal() == .alertFirstButtonReturn else { return }
        onDeleteProfile?(name)
    }

    @objc private func opacityChanged(_ sender: NSSlider) {
        updateOpacityLabel()
        onOpacityChange?(CGFloat(sender.doubleValue))
    }

    @objc private func colorChanged(_ sender: NSColorWell) {
        onColorChange?(sender.color)
    }

    // MARK: Public update methods

    func refreshProfiles(names: [String], selecting: String? = nil) {
        profilePopUp.removeAllItems()
        profilePopUp.addItems(withTitles: names)
        if let sel = selecting ?? names.first {
            profilePopUp.selectItem(withTitle: sel)
            nameField.stringValue = sel
        }
    }

    func syncAppearance(opacity: CGFloat, color: NSColor) {
        currentOpacity = opacity
        currentColor   = color
        opacitySlider.doubleValue = Double(opacity)
        updateOpacityLabel()
        colorWell.color = color
    }

    // MARK: Helpers

    private func updateOpacityLabel() {
        opacityLabel.stringValue = "\(Int(opacitySlider.doubleValue * 100))%"
    }

    private func labeledSection(title: String) -> NSStackView {
        let s = NSStackView()
        s.orientation = .vertical
        s.alignment   = .leading
        s.spacing     = 8

        let t = NSTextField(labelWithString: title)
        t.font = .boldSystemFont(ofSize: 12)
        t.textColor = .secondaryLabelColor
        s.addArrangedSubview(t)
        return s
    }

    private func hstack(_ views: [NSView]) -> NSStackView {
        let s = NSStackView(views: views)
        s.orientation = .horizontal
        s.spacing     = 8
        s.alignment   = .centerY
        return s
    }

    private func label(_ text: String) -> NSTextField {
        let f = NSTextField(labelWithString: text)
        f.font = .systemFont(ofSize: 13)
        return f
    }

    private func monoLabel(_ text: String) -> NSTextField {
        let f = NSTextField(labelWithString: text)
        f.font = .monospacedSystemFont(ofSize: 13, weight: .medium)
        f.textColor = .secondaryLabelColor
        return f
    }

    private func button(_ title: String, action: Selector) -> NSButton {
        let b = NSButton(title: title, target: self, action: action)
        b.bezelStyle = .rounded
        return b
    }

    private func makeSeparator() -> NSBox {
        let box = NSBox()
        box.boxType = .separator
        return box
    }

    private func shake(_ view: NSView) {
        let anim = CAKeyframeAnimation(keyPath: "transform.translation.x")
        anim.values = [-8, 8, -5, 5, 0]
        anim.duration = 0.3
        view.layer?.add(anim, forKey: "shake")
    }
}

// MARK: - NSWindowDelegate

extension SettingsWindowController: NSWindowDelegate {
    // Hide instead of close so the window can be reopened cheaply.
    func windowShouldClose(_ sender: NSWindow) -> Bool {
        sender.orderOut(nil)
        return false
    }
}
