import Foundation

final class ProfileManager {
    static let shared = ProfileManager()

    private let fileURL: URL
    private var state: AppState

    private init() {
        let appSupport = FileManager.default.urls(
            for: .applicationSupportDirectory, in: .userDomainMask
        ).first!
        let dir = appSupport.appendingPathComponent("SubtitleBlocker", isDirectory: true)
        try? FileManager.default.createDirectory(at: dir,
                                                  withIntermediateDirectories: true)
        fileURL = dir.appendingPathComponent("profiles.json")
        state = Self.load(from: fileURL)
    }

    // MARK: - Public API

    var profileNames: [String] {
        state.profiles.keys.sorted()
    }

    func profile(named name: String) -> Profile? {
        state.profiles[name]
    }

    func save(profile: Profile, named name: String) {
        state.profiles[name] = profile
        persist()
    }

    func delete(named name: String) {
        state.profiles.removeValue(forKey: name)
        if state.lastProfile == name { state.lastProfile = nil }
        persist()
    }

    var lastProfileName: String? {
        get { state.lastProfile }
        set { state.lastProfile = newValue; persist() }
    }

    var lastProfile: Profile? {
        guard let name = state.lastProfile else { return nil }
        return state.profiles[name]
    }

    // MARK: - Persistence

    private static func load(from url: URL) -> AppState {
        guard let data = try? Data(contentsOf: url),
              let loaded = try? JSONDecoder().decode(AppState.self, from: data)
        else { return AppState() }
        return loaded
    }

    private func persist() {
        guard let data = try? JSONEncoder().encode(state) else { return }
        try? data.write(to: fileURL, options: .atomic)
    }
}
