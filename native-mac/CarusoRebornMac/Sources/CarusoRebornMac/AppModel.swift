import AppKit
import Combine
import Foundation

@MainActor
final class BackendController: ObservableObject {
    enum BackendSource {
        case none
        case external
        case owned
    }

    @Published private(set) var isRunning = false
    @Published private(set) var lastError: String?
    @Published private(set) var latestLogLine = "Backend noch nicht gestartet."
    @Published private(set) var source: BackendSource = .none

    let localBaseURL = URL(string: "http://127.0.0.1:3847")!

    private var process: Process?
    private let fileManager = FileManager.default

    func startIfNeeded() async {
        if await checkHealth() {
            isRunning = true
            lastError = nil
            source = process == nil ? .external : .owned
            latestLogLine = process == nil
                ? "Externes Backend erkannt auf \(localBaseURL.absoluteString)"
                : "Eigenes Backend läuft auf \(localBaseURL.absoluteString)"
            return
        }

        guard process == nil else {
            await waitUntilHealthy()
            return
        }

        do {
            let backendRoot = try locateBackendRoot()
            try await ensureBackendArtifacts(in: backendRoot)
            let launch = try nodeLaunchConfiguration(for: backendRoot)
            let appSupportDirectory = try ensureAppSupportDirectory()

            let process = Process()
            let outputPipe = Pipe()
            process.executableURL = launch.executableURL
            process.arguments = launch.arguments
            process.currentDirectoryURL = backendRoot
            process.standardOutput = outputPipe
            process.standardError = outputPipe
            process.environment = backendEnvironment(
                backendRoot: backendRoot,
                appSupportDirectory: appSupportDirectory
            )

            outputPipe.fileHandleForReading.readabilityHandler = { [weak self] handle in
                let data = handle.availableData
                guard !data.isEmpty, let string = String(data: data, encoding: .utf8) else {
                    return
                }

                Task { @MainActor [weak self] in
                    self?.latestLogLine = string
                        .split(whereSeparator: \.isNewline)
                        .last
                        .map(String.init) ?? string.trimmingCharacters(in: .whitespacesAndNewlines)
                }
            }

            process.terminationHandler = { [weak self] _ in
                Task { @MainActor [weak self] in
                    guard let self else {
                        return
                    }

                    self.process = nil
                    self.isRunning = await self.checkHealth()
                    self.source = self.isRunning ? .external : .none
                    if !self.isRunning {
                        self.latestLogLine = "Backend wurde beendet."
                    } else {
                        self.latestLogLine = "Externes Backend weiterhin erreichbar auf \(self.localBaseURL.absoluteString)"
                    }
                }
            }

            try process.run()
            self.process = process
            self.source = .owned
            latestLogLine = "Backend wird gestartet..."

            await waitUntilHealthy()
        } catch {
            isRunning = false
            lastError = error.localizedDescription
            latestLogLine = "Backend-Start fehlgeschlagen."
            source = .none
        }
    }

    func stopOwnedBackend() {
        guard process != nil else {
            latestLogLine = "Kein von der App gestartetes Backend zum Stoppen vorhanden."
            return
        }

        process?.terminate()
        process = nil
        isRunning = false
        source = .none
        latestLogLine = "Eigenes Backend wird beendet..."
    }

    func clearError() {
        lastError = nil
    }

    var canStopOwnedBackend: Bool {
        process != nil && source == .owned
    }

    var statusDescription: String {
        switch source {
        case .none:
            return "Offline"
        case .external:
            return "Externes Backend aktiv"
        case .owned:
            return "Eigenes Backend aktiv"
        }
    }

    func refreshReachability() async {
        let reachable = await checkHealth()
        isRunning = reachable

        if process != nil {
            source = reachable ? .owned : .none
        } else {
            source = reachable ? .external : .none
        }

        if reachable {
            latestLogLine = source == .owned
                ? "Eigenes Backend läuft auf \(localBaseURL.absoluteString)"
                : "Externes Backend erkannt auf \(localBaseURL.absoluteString)"
            lastError = nil
        } else {
            latestLogLine = "Backend nicht erreichbar."
        }
    }

    private func waitUntilHealthy() async {
        for _ in 0..<30 {
            if await checkHealth() {
                isRunning = true
                lastError = nil
                source = process == nil ? .external : .owned
                latestLogLine = source == .owned
                    ? "Eigenes Backend läuft auf \(localBaseURL.absoluteString)"
                    : "Externes Backend erkannt auf \(localBaseURL.absoluteString)"
                return
            }

            try? await Task.sleep(for: .milliseconds(500))
        }

        isRunning = await checkHealth()
        if !isRunning {
            lastError = "Das Backend hat nicht rechtzeitig auf \(localBaseURL.absoluteString) geantwortet."
            source = .none
        }
    }

    private func checkHealth() async -> Bool {
        var request = URLRequest(url: localBaseURL.appending(path: "health"))
        request.timeoutInterval = 1.5

        do {
            let (_, response) = try await URLSession.shared.data(for: request)
            return (response as? HTTPURLResponse)?.statusCode == 200
        } catch {
            return false
        }
    }

    private func ensureBackendArtifacts(in repoRoot: URL) async throws {
        let backendScript = repoRoot.appending(path: "dist/src/native-server.js")
        guard !fileManager.fileExists(atPath: backendScript.path) else {
            return
        }

        latestLogLine = "Baue Node-Backend für die native App..."
        try await runProcess(
            executable: URL(fileURLWithPath: "/usr/bin/env"),
            arguments: ["npm", "run", "build"],
            currentDirectoryURL: repoRoot
        )
    }

    private func locateBackendRoot() throws -> URL {
        if let bundled = bundledBackendRoot() {
            return bundled
        }

        return try locateRepoRoot()
    }

    private func locateRepoRoot() throws -> URL {
        if let override = ProcessInfo.processInfo.environment["CARUSO_REBORN_REPO_ROOT"], !override.isEmpty {
            return URL(fileURLWithPath: override)
        }

        let searchRoots = [
            URL(fileURLWithPath: fileManager.currentDirectoryPath),
            URL(fileURLWithPath: #filePath).deletingLastPathComponent()
        ]

        for root in searchRoots {
            if let match = walkUpForRepoRoot(startingAt: root) {
                return match
            }
        }

        throw NSError(
            domain: "CarusoRebornMac",
            code: 1,
            userInfo: [NSLocalizedDescriptionKey: "Repo-Root für das Caruso-Reborn-Backend konnte nicht gefunden werden."]
        )
    }

    private func bundledBackendRoot() -> URL? {
        let candidates = [
            Bundle.main.resourceURL?.appending(path: "backend"),
            Bundle.main.bundleURL.appending(path: "Contents/Resources/backend")
        ].compactMap { $0 }

        for candidate in candidates {
            let packageJSON = candidate.appending(path: "package.json")
            let nativeServer = candidate.appending(path: "dist/src/native-server.js")

            if fileManager.fileExists(atPath: packageJSON.path), fileManager.fileExists(atPath: nativeServer.path) {
                return candidate
            }
        }

        return nil
    }

    private func walkUpForRepoRoot(startingAt initialURL: URL) -> URL? {
        var currentURL = initialURL.standardizedFileURL

        for _ in 0..<8 {
            let packageJSON = currentURL.appending(path: "package.json")
            let appTS = currentURL.appending(path: "src/app.ts")

            if fileManager.fileExists(atPath: packageJSON.path), fileManager.fileExists(atPath: appTS.path) {
                return currentURL
            }

            currentURL.deleteLastPathComponent()
        }

        return nil
    }

    private func ensureAppSupportDirectory() throws -> URL {
        let base = try fileManager.url(
            for: .applicationSupportDirectory,
            in: .userDomainMask,
            appropriateFor: nil,
            create: true
        )
        let directory = base.appending(path: "Caruso Reborn")
        try fileManager.createDirectory(at: directory, withIntermediateDirectories: true)
        return directory
    }

    private func backendEnvironment(
        backendRoot: URL,
        appSupportDirectory: URL
    ) -> [String: String] {
        var environment = ProcessInfo.processInfo.environment
        environment["DATA_DIR"] = appSupportDirectory.appending(path: "backend-data").path
        environment["CARUSO_REBORN_ENV_PATH"] = appSupportDirectory.appending(path: "backend.env").path
        environment["CARUSO_REBORN_REPO_ROOT"] = backendRoot.path
        return environment
    }

    private func nodeLaunchConfiguration(for backendRoot: URL) throws -> (executableURL: URL, arguments: [String]) {
        let scriptURL = backendRoot.appending(path: "dist/src/native-server.js")

        if let nodeURL = bundledNodeURL() ?? systemNodeURL() {
            return (nodeURL, [scriptURL.path])
        }

        throw NSError(
            domain: "CarusoRebornMac",
            code: 4,
            userInfo: [NSLocalizedDescriptionKey: "Keine ausführbare Backend-Runtime gefunden. Bitte die App neu bauen oder lokal Node 20+ bereitstellen."]
        )
    }

    private func bundledNodeURL() -> URL? {
        let bundled = Bundle.main.resourceURL?.appending(path: "runtime/bin/node")
        guard let bundled, fileManager.isExecutableFile(atPath: bundled.path) else {
            return nil
        }

        return bundled
    }

    private func systemNodeURL() -> URL? {
        let candidates = [
            ProcessInfo.processInfo.environment["CARUSO_REBORN_NODE"],
            "/opt/homebrew/bin/node",
            "/usr/local/bin/node",
            "/usr/bin/node"
        ].compactMap { $0 }

        for candidate in candidates {
            if fileManager.isExecutableFile(atPath: candidate) {
                return URL(fileURLWithPath: candidate)
            }
        }

        return nil
    }

    private func runProcess(
        executable: URL,
        arguments: [String],
        currentDirectoryURL: URL
    ) async throws {
        let process = Process()
        let pipe = Pipe()
        process.executableURL = executable
        process.arguments = arguments
        process.currentDirectoryURL = currentDirectoryURL
        process.standardOutput = pipe
        process.standardError = pipe

        try process.run()
        process.waitUntilExit()

        if process.terminationStatus == 0 {
            return
        }

        let data = try pipe.fileHandleForReading.readToEnd() ?? Data()
        let message = String(data: data, encoding: .utf8)?.trimmingCharacters(in: .whitespacesAndNewlines)
        throw NSError(
            domain: "CarusoRebornMac",
            code: Int(process.terminationStatus),
            userInfo: [NSLocalizedDescriptionKey: message?.isEmpty == false ? message! : "Backend-Build fehlgeschlagen."]
        )
    }
}

@MainActor
final class AppModel: ObservableObject {
    @Published var status: StatusResponse?
    @Published var rendererStatus: RendererStatus?
    @Published var discoveredDevices: [DiscoveredDevice] = []
    @Published var networkCandidates: [NetworkCandidate] = []
    @Published var tracks: [LocalTrack] = []
    @Published var selectedDeviceURL: String?
    @Published var selectedDeviceName: String?
    @Published private(set) var uiLanguage: AppLanguage = AppLanguage.systemDefault
    @Published private(set) var targetPlatform: TargetPlatformOption = .mac
    @Published var rendererFilterName = ""
    @Published var deezerARL = ""
    @Published var selectedNetworkCandidateID: String?
    @Published var hasCompletedOnboarding: Bool
    @Published var isBootstrapping = false
    @Published var isBusy = false
    @Published var lastError: String?

    private let defaults = UserDefaults.standard
    private let backend: BackendController
    private var pollingTask: Task<Void, Never>?

    init(backend: BackendController) {
        let defaults = UserDefaults.standard
        self.backend = backend
        self.uiLanguage = AppLanguage.systemDefault
        self.selectedDeviceURL = defaults.string(forKey: "selectedDeviceURL")
        self.selectedDeviceName = defaults.string(forKey: "selectedDeviceName")
        self.hasCompletedOnboarding = defaults.bool(forKey: "hasCompletedOnboarding")
    }

    deinit {
        pollingTask?.cancel()
    }

    func bootstrap() async {
        guard !isBootstrapping else { return }

        isBootstrapping = true
        await backend.startIfNeeded()

        guard backend.isRunning else {
            lastError = backend.lastError
            isBootstrapping = false
            return
        }

        await refreshAll()
        startPolling()
        isBootstrapping = false
    }

    func openWebDashboard() {
        guard let urlString = status?.server.publicBaseURL ?? backend.localBaseURL.absoluteString as String?,
              let url = URL(string: urlString) else {
            return
        }

        NSWorkspace.shared.open(url)
    }

    func refreshLiveSnapshot() async {
        guard backend.isRunning else { return }

        do {
            let status: StatusResponse = try await request(path: "api/status")
            self.status = status
            self.uiLanguage = AppLanguage.systemDefault
            self.targetPlatform = .mac
            self.rendererFilterName = status.config.rendererFilterName ?? rendererFilterName
            self.deezerARL = status.config.deezerArl ?? deezerARL
            await refreshRendererStatus()
            lastError = nil
        } catch {
            lastError = error.localizedDescription
        }
    }

    func refreshAll() async {
        guard backend.isRunning else { return }

        isBusy = true
        defer { isBusy = false }

        do {
            let status: StatusResponse = try await request(path: "api/status")
            let devices: DeviceDiscoveryResponse = try await request(path: "api/discover")
            let tracks: TracksResponse = try await request(path: "api/library/tracks")
            let network: NetworkCandidatesResponse = try await request(path: "api/network/candidates")

            self.status = status
            self.discoveredDevices = devices.devices
            self.tracks = tracks.items
            self.networkCandidates = network.candidates
            self.uiLanguage = AppLanguage.systemDefault
            self.targetPlatform = .mac
            self.rendererFilterName = status.config.rendererFilterName ?? ""
            self.deezerARL = status.config.deezerArl ?? ""
            syncNetworkSelection(using: status, network: network)
            applyPersistedRendererSelection()
            await refreshRendererStatus()
            lastError = nil
        } catch {
            lastError = error.localizedDescription
        }
    }

    func refreshRendererStatus() async {
        guard backend.isRunning else { return }
        guard let selectedDeviceURL, !selectedDeviceURL.isEmpty else {
            rendererStatus = nil
            return
        }

        do {
            let encoded = selectedDeviceURL.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? selectedDeviceURL
            let result: RendererStatusEnvelope = try await request(path: "api/renderer/status?deviceDescriptionUrl=\(encoded)")
            rendererStatus = result.status
        } catch {
            rendererStatus = nil
        }
    }

    func completeOnboarding() async {
        guard let network = selectedNetworkCandidate else {
            lastError = "Bitte zuerst ein Netzwerk wählen."
            return
        }

        guard let device = selectedOnboardingDevice else {
            lastError = "Bitte zuerst einen Caruso auswählen."
            return
        }

        do {
            isBusy = true
            try await submitNetwork(candidate: network)
            rendererFilterName = device.description?.friendlyName ?? device.displayName
            selectedDeviceURL = device.location
            selectedDeviceName = device.displayName
            persistDeviceSelection()
            let _: BackendConfig = try await request(
                path: "api/config",
                method: "PUT",
                body: ConfigUpdatePayload(
                    publicBaseURL: network.baseURL,
                    rendererFilterName: rendererFilterName,
                    deezerArl: deezerARL.isEmpty ? nil : deezerARL,
                    uiLanguage: AppLanguage.systemDefault,
                    targetPlatform: targetPlatform
                )
            )

            hasCompletedOnboarding = true
            defaults.set(true, forKey: "hasCompletedOnboarding")
            await refreshAll()
            lastError = nil
        } catch {
            lastError = error.localizedDescription
        }

        isBusy = false
    }

    func saveSettings() async {
        guard backend.isRunning else { return }

        do {
            isBusy = true

            if let network = selectedNetworkCandidate {
                try await submitNetwork(candidate: network)
            }

            let _: BackendConfig = try await request(
                path: "api/config",
                method: "PUT",
                body: ConfigUpdatePayload(
                    publicBaseURL: selectedNetworkCandidate?.baseURL ?? status?.config.publicBaseURL,
                    rendererFilterName: rendererFilterName.isEmpty ? nil : rendererFilterName,
                    deezerArl: deezerARL.isEmpty ? nil : deezerARL,
                    uiLanguage: AppLanguage.systemDefault,
                    targetPlatform: targetPlatform
                )
            )

            await refreshAll()
            lastError = nil
        } catch {
            lastError = error.localizedDescription
        }

        isBusy = false
    }

    func saveSelectedRenderer(_ device: DiscoveredDevice) async {
        selectedDeviceURL = device.location
        selectedDeviceName = device.displayName
        rendererFilterName = device.description?.friendlyName ?? device.displayName
        persistDeviceSelection()
        await saveSettings()
    }

    func playFavorite(_ favorite: FavoriteStation) async {
        guard let selectedDeviceURL, !selectedDeviceURL.isEmpty else {
            lastError = "Bitte zuerst einen Caruso auswählen."
            return
        }

        do {
            let _: PlayFavoriteResponse = try await request(
                path: "api/caruso/play/tunein",
                method: "POST",
                body: PlayFavoritePayload(
                    deviceDescriptionURL: selectedDeviceURL,
                    title: favorite.title,
                    streamURL: favorite.streamURL,
                    bitrate: favorite.bitrate,
                    mimeType: favorite.mimeType
                )
            )
            await refreshRendererStatus()
            lastError = nil
        } catch {
            lastError = error.localizedDescription
        }
    }

    func playTrack(_ track: LocalTrack) async {
        guard let selectedDeviceURL, !selectedDeviceURL.isEmpty else {
            lastError = "Bitte zuerst einen Caruso auswählen."
            return
        }

        do {
            let _: PlayLocalResponse = try await request(
                path: "api/caruso/play/local",
                method: "POST",
                body: PlayLocalPayload(
                    deviceDescriptionURL: selectedDeviceURL,
                    trackID: track.id
                )
            )
            await refreshRendererStatus()
            lastError = nil
        } catch {
            lastError = error.localizedDescription
        }
    }

    func chooseAndAddFolder() async {
        let panel = NSOpenPanel()
        panel.canChooseDirectories = true
        panel.canChooseFiles = false
        panel.allowsMultipleSelection = false
        panel.prompt = "Ordner hinzufügen"

        guard panel.runModal() == .OK, let url = panel.url else {
            return
        }

        do {
            let _: FoldersResponse = try await request(path: "api/library/folders", method: "POST", body: ["path": url.path])
            await refreshAll()
            lastError = nil
        } catch {
            lastError = error.localizedDescription
        }
    }

    func removeFolder(_ folder: String) async {
        do {
            let _: FoldersResponse = try await request(
                path: "api/library/folders/remove",
                method: "POST",
                body: ["path": folder]
            )
            await refreshAll()
            lastError = nil
        } catch {
            lastError = error.localizedDescription
        }
    }

    func resetOnboarding() {
        hasCompletedOnboarding = false
        defaults.set(false, forKey: "hasCompletedOnboarding")
    }

    func selectedDevice(_ device: DiscoveredDevice) {
        selectedDeviceURL = device.location
        selectedDeviceName = device.displayName
        persistDeviceSelection()
    }

    var selectedNetworkCandidate: NetworkCandidate? {
        networkCandidates.first(where: { $0.id == selectedNetworkCandidateID }) ?? networkCandidates.first
    }

    private var selectedOnboardingDevice: DiscoveredDevice? {
        discoveredDevices.first(where: { $0.location == selectedDeviceURL }) ?? discoveredDevices.first
    }

    private func submitNetwork(candidate: NetworkCandidate) async throws {
        let mode = candidate.isVirtual ? "manual" : "automatic"
        let _: NetworkSelectionResponse = try await request(
            path: "api/network/select",
            method: "POST",
            body: NetworkSelectionPayload(
                interfaceName: candidate.interfaceName,
                address: candidate.address,
                mode: mode
            )
        )
    }

    private func syncNetworkSelection(using status: StatusResponse, network: NetworkCandidatesResponse) {
        let currentHost = URL(string: status.server.publicBaseURL)?.host
        selectedNetworkCandidateID = network.candidates.first(where: { $0.address == currentHost })?.id
            ?? network.candidates.first(where: { $0.address == network.recommendedAddress })?.id
            ?? network.candidates.first?.id
    }

    private func applyPersistedRendererSelection() {
        if let selectedDeviceURL, discoveredDevices.contains(where: { $0.location == selectedDeviceURL }) {
            return
        }

        if let filtered = discoveredDevices.first(where: { $0.displayName == rendererFilterName || $0.description?.friendlyName == rendererFilterName }) {
            selectedDeviceURL = filtered.location
            selectedDeviceName = filtered.displayName
            persistDeviceSelection()
            return
        }

        if let first = discoveredDevices.first {
            selectedDeviceURL = first.location
            selectedDeviceName = first.displayName
            persistDeviceSelection()
        }
    }

    private func persistDeviceSelection() {
        defaults.set(selectedDeviceURL, forKey: "selectedDeviceURL")
        defaults.set(selectedDeviceName, forKey: "selectedDeviceName")
    }

    private func startPolling() {
        pollingTask?.cancel()
        pollingTask = Task { [weak self] in
            while !Task.isCancelled {
                try? await Task.sleep(for: .seconds(3))
                await self?.refreshLiveSnapshot()
            }
        }
    }

    private func buildURL(for path: String) throws -> URL {
        guard let url = URL(string: path, relativeTo: backend.localBaseURL)?.absoluteURL else {
            throw NSError(domain: "CarusoRebornMac", code: 3, userInfo: [NSLocalizedDescriptionKey: "Ungültige Backend-URL für \(path)"])
        }

        return url
    }

    private func request<Response: Decodable>(
        path: String,
        method: String = "GET"
    ) async throws -> Response {
        let url = try buildURL(for: path)
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.timeoutInterval = 12

        let (data, response) = try await URLSession.shared.data(for: request)
        return try decodeResponse(data: data, response: response)
    }

    private func request<Response: Decodable, Body: Encodable>(
        path: String,
        method: String = "GET",
        body: Body?
    ) async throws -> Response {
        let url = try buildURL(for: path)
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.timeoutInterval = 12

        if let body {
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.httpBody = try JSONEncoder().encode(body)
        }

        let (data, response) = try await URLSession.shared.data(for: request)
        return try decodeResponse(data: data, response: response)
    }

    private func decodeResponse<Response: Decodable>(
        data: Data,
        response: URLResponse
    ) throws -> Response {
        guard let httpResponse = response as? HTTPURLResponse else {
            throw NSError(domain: "CarusoRebornMac", code: 2, userInfo: [NSLocalizedDescriptionKey: "Ungültige Backend-Antwort."])
        }

        guard (200..<300).contains(httpResponse.statusCode) else {
            let message = (try? JSONDecoder().decode(ErrorPayload.self, from: data).error) ?? "HTTP \(httpResponse.statusCode)"
            throw NSError(domain: "CarusoRebornMac", code: httpResponse.statusCode, userInfo: [NSLocalizedDescriptionKey: message])
        }

        return try JSONDecoder().decode(Response.self, from: data)
    }
}
