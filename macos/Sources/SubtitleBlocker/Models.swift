import AppKit

// MARK: - CodableColor

/// NSColor wrapper so Profile can be fully Codable.
struct CodableColor: Codable, Equatable {
    var red: Double
    var green: Double
    var blue: Double

    init(_ color: NSColor) {
        let c = color.usingColorSpace(.sRGB) ?? color
        red   = Double(c.redComponent)
        green = Double(c.greenComponent)
        blue  = Double(c.blueComponent)
    }

    var nsColor: NSColor {
        NSColor(srgbRed: red, green: green, blue: blue, alpha: 1.0)
    }

    // Hex string for display / interop with Electron profiles
    var hexString: String {
        String(format: "#%02X%02X%02X",
               Int(red * 255), Int(green * 255), Int(blue * 255))
    }

    static let black = CodableColor(NSColor.black)
}

// MARK: - Profile

struct Profile: Codable, Equatable {
    var x: Double
    var y: Double
    var width: Double
    var height: Double
    /// 0.1 … 1.0
    var opacity: Double
    var color: CodableColor
    /// When true the overlay shows a blur (NSVisualEffectView) instead of a solid fill.
    var blurEnabled: Bool

    static let `default` = Profile(
        x: 0,           // centered at load time
        y: 80,
        width: 800,
        height: 100,
        opacity: 0.85,
        color: .black,
        blurEnabled: false
    )

    // Custom decoding so old saved profiles (without blurEnabled) load cleanly.
    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        x           = try c.decode(Double.self,       forKey: .x)
        y           = try c.decode(Double.self,       forKey: .y)
        width       = try c.decode(Double.self,       forKey: .width)
        height      = try c.decode(Double.self,       forKey: .height)
        opacity     = try c.decode(Double.self,       forKey: .opacity)
        color       = try c.decode(CodableColor.self, forKey: .color)
        blurEnabled = try c.decodeIfPresent(Bool.self, forKey: .blurEnabled) ?? false
    }

    init(x: Double, y: Double, width: Double, height: Double,
         opacity: Double, color: CodableColor, blurEnabled: Bool = false) {
        self.x = x; self.y = y; self.width = width; self.height = height
        self.opacity = opacity; self.color = color; self.blurEnabled = blurEnabled
    }
}

// MARK: - AppState

struct AppState: Codable {
    var profiles: [String: Profile] = [:]
    var lastProfile: String? = nil
}
