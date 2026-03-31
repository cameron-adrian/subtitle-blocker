import AppKit

// Entry point.
// AppDelegate is instantiated here so there is no dependency on a XIB or
// Info.plist NSPrincipalClass lookup at runtime when run as an SPM executable.

let app      = NSApplication.shared
let delegate = AppDelegate()
app.delegate = delegate
_ = NSApplicationMain(CommandLine.argc, CommandLine.unsafeArgv)
