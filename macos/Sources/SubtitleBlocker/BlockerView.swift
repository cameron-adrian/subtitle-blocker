import AppKit

// MARK: - BlockerView

/// The visible draggable/resizable rectangle that covers subtitles.
///
/// Resize handle hit areas are 8 pt wide along each edge and 16×16 pt at corners.
/// The view is embedded in a fullscreen PassthroughView; only the blocker's frame
/// receives mouse events.
final class BlockerView: NSView {

    // MARK: Appearance

    var fillColor: NSColor = .black { didSet { needsDisplay = true } }
    /// 0.1 … 1.0 — applied via the layer's opacity so the window itself stays clear.
    var fillOpacity: CGFloat = 0.85 { didSet { layer?.opacity = Float(fillOpacity) } }
    /// When true, shows a frosted-glass blur instead of a solid fill.
    var blurEnabled: Bool = false {
        didSet {
            blurView.isHidden = !blurEnabled
            needsDisplay = true
        }
    }

    // Lazy so the view exists before addSubview is called in commonInit.
    private lazy var blurView: NSVisualEffectView = {
        let v = NSVisualEffectView(frame: bounds)
        v.autoresizingMask = [.width, .height]
        v.blendingMode = .behindWindow
        v.material     = .fullScreenUI
        v.state        = .active
        v.wantsLayer   = true
        v.layer?.cornerRadius  = 4
        v.layer?.masksToBounds = true
        v.isHidden = true
        return v
    }()

    // MARK: Resize directions

    private enum Handle: CaseIterable {
        case n, s, e, w, ne, nw, se, sw
        var cursor: NSCursor {
            switch self {
            case .n:  return .resizeUp
            case .s:  return .resizeDown
            case .e:  return .resizeRight
            case .w:  return .resizeLeft
            case .ne, .sw: return .crosshair   // no public diagonal cursor in AppKit
            case .nw, .se: return .crosshair
            }
        }
    }

    // MARK: Drag / resize state

    private var activeHandle: Handle?
    private var isDragging = false
    private var mouseStart = NSPoint.zero
    private var frameStart = NSRect.zero

    // Called after every drag/resize so the owner can persist the position.
    var onFrameChanged: ((NSRect) -> Void)?

    // MARK: Init

    override init(frame: NSRect) {
        super.init(frame: frame)
        commonInit()
    }
    required init?(coder: NSCoder) {
        super.init(coder: coder)
        commonInit()
    }

    private func commonInit() {
        wantsLayer = true
        layer?.cornerRadius  = 4
        layer?.masksToBounds = true
        // Opacity is on the layer so the color/alpha stay independent.
        layer?.opacity = Float(fillOpacity)
        // Ensure blurView is inserted before any drawing occurs.
        addSubview(blurView)
    }

    // MARK: Drawing

    override func draw(_ dirtyRect: NSRect) {
        if blurEnabled {
            // Blur mode: draw a light colour tint over the NSVisualEffectView.
            fillColor.withAlphaComponent(0.25).setFill()
        } else {
            // Solid mode: fill fully (layer opacity provides overall transparency).
            fillColor.withAlphaComponent(1.0).setFill()
        }
        NSBezierPath(roundedRect: bounds, xRadius: 4, yRadius: 4).fill()

        // Hover border while dragging / resizing.
        if isDragging || activeHandle != nil {
            NSColor.white.withAlphaComponent(0.4).setStroke()
            let path = NSBezierPath(roundedRect: bounds.insetBy(dx: 1, dy: 1),
                                    xRadius: 4, yRadius: 4)
            path.lineWidth = 2
            path.stroke()
        }
    }

    // MARK: Hit areas

    private let edgeWidth: CGFloat = 8
    private let cornerSize: CGFloat = 16

    private func handle(at point: NSPoint) -> Handle? {
        let b = bounds
        let e = edgeWidth, c = cornerSize

        // Corners take priority over edges.
        if NSRect(x: b.maxX - c, y: b.maxY - c, width: c, height: c).contains(point) { return .ne }
        if NSRect(x: 0,           y: b.maxY - c, width: c, height: c).contains(point) { return .nw }
        if NSRect(x: b.maxX - c, y: 0,           width: c, height: c).contains(point) { return .se }
        if NSRect(x: 0,           y: 0,           width: c, height: c).contains(point) { return .sw }

        if point.y >= b.maxY - e { return .n }
        if point.y <= e           { return .s }
        if point.x >= b.maxX - e { return .e }
        if point.x <= e           { return .w }

        return nil
    }

    // MARK: Mouse events

    override func mouseDown(with event: NSEvent) {
        let pt = convert(event.locationInWindow, from: nil)
        activeHandle = handle(at: pt)
        isDragging   = activeHandle == nil
        mouseStart   = event.locationInWindow
        frameStart   = frame
        needsDisplay = true
    }

    override func mouseDragged(with event: NSEvent) {
        guard let superview else { return }
        let current = event.locationInWindow
        let dx = current.x - mouseStart.x
        let dy = current.y - mouseStart.y

        var newFrame = frameStart
        let minW: CGFloat = 100
        let minH: CGFloat = 30

        if isDragging {
            newFrame.origin.x += dx
            newFrame.origin.y += dy
        } else if let h = activeHandle {
            switch h {
            case .n:
                newFrame.size.height = max(minH, frameStart.height + dy)
            case .s:
                let newH = max(minH, frameStart.height - dy)
                newFrame.origin.y = frameStart.origin.y + frameStart.height - newH
                newFrame.size.height = newH
            case .e:
                newFrame.size.width = max(minW, frameStart.width + dx)
            case .w:
                let newW = max(minW, frameStart.width - dx)
                newFrame.origin.x = frameStart.origin.x + frameStart.width - newW
                newFrame.size.width = newW
            case .ne:
                newFrame.size.width  = max(minW, frameStart.width + dx)
                newFrame.size.height = max(minH, frameStart.height + dy)
            case .nw:
                let newW = max(minW, frameStart.width - dx)
                newFrame.origin.x   = frameStart.origin.x + frameStart.width - newW
                newFrame.size.width = newW
                newFrame.size.height = max(minH, frameStart.height + dy)
            case .se:
                newFrame.size.width = max(minW, frameStart.width + dx)
                let newH = max(minH, frameStart.height - dy)
                newFrame.origin.y   = frameStart.origin.y + frameStart.height - newH
                newFrame.size.height = newH
            case .sw:
                let newW = max(minW, frameStart.width - dx)
                newFrame.origin.x   = frameStart.origin.x + frameStart.width - newW
                newFrame.size.width = newW
                let newH = max(minH, frameStart.height - dy)
                newFrame.origin.y   = frameStart.origin.y + frameStart.height - newH
                newFrame.size.height = newH
            }
        }

        // Clamp inside the superview (screen).
        let sv = superview.bounds
        newFrame.origin.x = max(sv.minX, min(sv.maxX - newFrame.width,  newFrame.origin.x))
        newFrame.origin.y = max(sv.minY, min(sv.maxY - newFrame.height, newFrame.origin.y))

        frame = newFrame
        (superview as? PassthroughView)?.blockerFrame = newFrame
    }

    override func mouseUp(with event: NSEvent) {
        isDragging   = false
        activeHandle = nil
        needsDisplay = true
        onFrameChanged?(frame)
    }

    // MARK: Cursor tracking

    override func resetCursorRects() {
        // Resize handle rects — corners first.
        let b = bounds; let c = cornerSize; let e = edgeWidth
        addCursorRect(NSRect(x: b.maxX - c, y: b.maxY - c, width: c, height: c), cursor: Handle.ne.cursor)
        addCursorRect(NSRect(x: 0,           y: b.maxY - c, width: c, height: c), cursor: Handle.nw.cursor)
        addCursorRect(NSRect(x: b.maxX - c, y: 0,           width: c, height: c), cursor: Handle.se.cursor)
        addCursorRect(NSRect(x: 0,           y: 0,           width: c, height: c), cursor: Handle.sw.cursor)
        // Edges
        addCursorRect(NSRect(x: c, y: b.maxY - e, width: b.width - c * 2, height: e), cursor: .resizeUpDown)
        addCursorRect(NSRect(x: c, y: 0,           width: b.width - c * 2, height: e), cursor: .resizeUpDown)
        addCursorRect(NSRect(x: b.maxX - e, y: c,  width: e, height: b.height - c * 2), cursor: .resizeLeftRight)
        addCursorRect(NSRect(x: 0,           y: c,  width: e, height: b.height - c * 2), cursor: .resizeLeftRight)
        // Center — move cursor
        addCursorRect(NSRect(x: e, y: e, width: b.width - e * 2, height: b.height - e * 2),
                      cursor: .openHand)
    }
}

// MARK: - PassthroughView

/// Full-screen content view that forwards only hits inside the blockerView's frame.
/// All other mouse events fall through to windows behind the panel.
final class PassthroughView: NSView {
    var blockerFrame: NSRect = .zero

    override func hitTest(_ point: NSPoint) -> NSView? {
        blockerFrame.contains(point) ? super.hitTest(point) : nil
    }

    // Transparent — never paint.
    override var isOpaque: Bool { false }
    override func draw(_ dirtyRect: NSRect) {}
}
