import AppKit
import Carbon.HIToolbox
import Foundation

// MARK: - ShortcutManager
//
// Uses Carbon's RegisterEventHotKey API, which fires without requiring
// Accessibility / Input Monitoring permissions.
//
// Shortcuts:
//   ⌘⇧H — toggle blocker
//   ⌘⇧S — open settings
//   ⌘⇧Q — quit

extension Notification.Name {
    static let toggleBlocker = Notification.Name("com.subtitleblocker.toggleBlocker")
    static let showSettings  = Notification.Name("com.subtitleblocker.showSettings")
}

final class ShortcutManager {
    static let shared = ShortcutManager()

    private var hotKeyRefs: [EventHotKeyRef] = []
    private var eventHandlerRef: EventHandlerRef?

    private init() {}

    func register() {
        // Install a single application-level Carbon event handler.
        var spec = EventTypeSpec(
            eventClass: OSType(kEventClassKeyboard),
            eventKind: UInt32(kEventHotKeyPressed)
        )

        // Capture `self` weakly via the refCon pointer.
        let refCon = Unmanaged.passRetained(self).toOpaque()

        InstallEventHandler(
            GetApplicationEventTarget(),
            { (_: EventHandlerCallRef?, event: EventRef?, refCon: UnsafeMutableRawPointer?) -> OSStatus in
                guard let event else { return OSStatus(eventNotHandledErr) }
                var hkID = EventHotKeyID()
                let err = GetEventParameter(
                    event,
                    EventParamName(kEventParamDirectObject),
                    EventParamType(typeEventHotKeyID),
                    nil,
                    MemoryLayout<EventHotKeyID>.size,
                    nil,
                    &hkID
                )
                guard err == noErr else { return OSStatus(eventNotHandledErr) }

                DispatchQueue.main.async {
                    switch hkID.id {
                    case 1:
                        NotificationCenter.default.post(name: .toggleBlocker, object: nil)
                    case 2:
                        NotificationCenter.default.post(name: .showSettings, object: nil)
                    case 3:
                        exit(0)
                    default:
                        break
                    }
                }
                return noErr
            },
            1, &spec, refCon, &eventHandlerRef
        )

        // "SBLK" signature as a 4-byte OSType.
        let sig: OSType = 0x53424C4B  // 'SBLK'
        let mods = UInt32(cmdKey | shiftKey)

        registerHotKey(vk: UInt32(kVK_ANSI_H), mods: mods, id: 1, sig: sig)  // ⌘⇧H toggle
        registerHotKey(vk: UInt32(kVK_ANSI_S), mods: mods, id: 2, sig: sig)  // ⌘⇧S settings
        registerHotKey(vk: UInt32(kVK_ANSI_Q), mods: mods, id: 3, sig: sig)  // ⌘⇧Q quit
    }

    func unregisterAll() {
        hotKeyRefs.forEach { UnregisterEventHotKey($0) }
        hotKeyRefs.removeAll()
        if let h = eventHandlerRef {
            RemoveEventHandler(h)
            eventHandlerRef = nil
        }
    }

    private func registerHotKey(vk: UInt32, mods: UInt32, id: UInt32, sig: OSType) {
        let hkID = EventHotKeyID(signature: sig, id: id)
        var ref: EventHotKeyRef?
        let status = RegisterEventHotKey(vk, mods, hkID,
                                         GetApplicationEventTarget(), 0, &ref)
        if status == noErr, let r = ref {
            hotKeyRefs.append(r)
        } else {
            // Non-fatal: shortcut was already registered by another app.
            print("[ShortcutManager] Could not register hotkey id=\(id), OSStatus=\(status)")
        }
    }
}
