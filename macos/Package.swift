// swift-tools-version:5.9
import PackageDescription

let package = Package(
    name: "SubtitleBlocker",
    platforms: [.macOS(.v13)],
    targets: [
        .executableTarget(
            name: "SubtitleBlocker",
            path: "Sources/SubtitleBlocker",
            resources: [.process("../../Resources")],
            linkerSettings: [
                .linkedFramework("Carbon"),
                .linkedFramework("AppKit"),
            ]
        )
    ]
)
