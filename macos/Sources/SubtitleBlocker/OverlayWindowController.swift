import AppKit

// MARK: - OverlayWindowController

/// Manages the always-on-top transparent NSPanel that houses the BlockerView.
///
/// ## macOS fullscreen overlay limitations
///
/// Apple does not provide a documented API that guarantees a window appears
/// above every possible fullscreen application in every macOS version.
/// This implementation uses the following combination which works on macOS 13+:
///
/// - `NSWindow.Level.screenSaver` — the highest documented level
/// - `.canJoinAllSpaces` — makes the panel visible on every Space
/// - `.fullScreenAuxiliary` — allows entry into another app's fullscreen Space
/// - `.ignoresCycle` — keeps it out of Cmd-Tab cycling
///
/// **Known gaps:**
/// - Safari full-window video / Picture-in-Picture runs in a separate process
///   at a privileged window level and can appear above `screenSaver`.
/// - Some third-party players (IINA, VLC native fullscreen) use a CGDisplayCapture
///   mechanism that bypasses the normal window hierarchy entirely.
/// - macOS 14 (Sonoma) introduced background tinting that may affect perceived opacity.
///
/// For browser-based video (YouTube, Netflix in Chrome/Firefox) and most local
/// players the overlay works reliably.
final class OverlayWindowController: NSWindowController {

    private(set) var blockerView: BlockerView!
    private var passthroughView: PassthroughView!

    /// Whether the blocker rectangle is currently shown.
    private(set) var isVisible = true

    // MARK: Init

    init() {
        let panel = Self.makePanel()
        super.init(window: panel)
        buildViews(in: panel)
    }
    required init?(coder: NSCoder) { fatalError("not implemented") }

    // MARK: Factory

    private static func makePanel() -> NSPanel {
        guard let screen = NSScreen.main else {
            fatalError("No screen available")
        }
        let panel = NSPanel(
            contentRect: screen.frame,
            styleMask: [.borderless, .nonactivatingPanel],
            backing: .buffered,
            defer: false
        )
        // Highest documented level — above ordinary apps, below screen lock.
        panel.level = .screenSaver
        panel.collectionBehavior = [
            .canJoinAllSpaces,
            .fullScreenAuxiliary,
            .ignoresCycle,
            .stationary,
        ]
        panel.isOpaque         = false
        panel.backgroundColor  = .clear
        panel.hasShadow        = false
        panel.ignoresMouseEvents = false   // PassthroughView handles per-pixel routing
        panel.acceptsMouseMovedEvents = true
        panel.hidesOnDeactivate = false
        panel.isFloatingPanel   = true
        panel.canHide           = false
        return panel
    }

    private func buildViews(in panel: NSPanel) {
        let contentFrame = panel.contentRect(forFrameRect: panel.frame)

        passthroughView = PassthroughView(frame: NSRect(origin: .zero, size: contentFrame.size))
        passthroughView.autoresizingMask = [.width, .height]
        panel.contentView = passthroughView

        // Default blocker: centred horizontally, 80 pt from bottom.
        let bw: CGFloat = 800, bh: CGFloat = 100
        let bx = (contentFrame.width - bw) / 2
        let by: CGFloat = 80
        let initialFrame = NSRect(x: bx, y: by, width: bw, height: bh)

        blockerView = BlockerView(frame: initialFrame)
        blockerView.onFrameChanged = { [weak self] _ in
            self?.syncPassthroughFrame()
        }
        passthroughView.addSubview(blockerView)
        passthroughView.blockerFrame = initialFrame
    }

    // MARK: Public interface

    func apply(profile: Profile) {
        guard let screen = NSScreen.main else { return }
        // Profiles store Y from the bottom of the screen (matching Electron).
        let frame = NSRect(x: profile.x,
                           y: profile.y,
                           width: profile.width,
                           height: profile.height)
        blockerView.frame = frame
        passthroughView.blockerFrame = frame

        blockerView.fillColor   = profile.color.nsColor
        blockerView.fillOpacity = profile.opacity
        blockerView.blurEnabled = profile.blurEnabled
        blockerView.needsDisplay = true
    }

    func currentProfile(merging base: Profile) -> Profile {
        let f = blockerView.frame
        return Profile(
            x: f.origin.x, y: f.origin.y,
            width: f.width, height: f.height,
            opacity: blockerView.fillOpacity,
            color: CodableColor(blockerView.fillColor),
            blurEnabled: blockerView.blurEnabled
        )
    }

    func setOpacity(_ opacity: CGFloat) {
        blockerView.fillOpacity = opacity
    }

    func setColor(_ color: NSColor) {
        blockerView.fillColor = color
        blockerView.needsDisplay = true
    }

    func setBlur(_ enabled: Bool) {
        blockerView.blurEnabled = enabled
    }

    func toggleVisibility() {
        isVisible.toggle()
        blockerView.isHidden = !isVisible
        // When hidden, no need for passthrough filtering either.
        passthroughView.blockerFrame = isVisible ? blockerView.frame : .zero
    }

    func show() {
        window?.orderFrontRegardless()
    }

    // MARK: Helpers

    private func syncPassthroughFrame() {
        passthroughView.blockerFrame = blockerView.frame
    }

    // Handle screen resolution / arrangement changes.
    func screenDidChange() {
        guard let panel = window as? NSPanel,
              let screen = NSScreen.main else { return }
        panel.setFrame(screen.frame, display: true)
        passthroughView.frame = NSRect(origin: .zero, size: screen.frame.size)
    }
}
