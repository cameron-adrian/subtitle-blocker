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

    static let `default` = Profile(
        x: 0,           // centered at load time
        y: 80,
        width: 800,
        height: 100,
        opacity: 0.85,
        color: .black
    )
}

// MARK: - AppState

struct AppState: Codable {
    var profiles: [String: Profile] = [:]
    var lastProfile: String? = nil
}
