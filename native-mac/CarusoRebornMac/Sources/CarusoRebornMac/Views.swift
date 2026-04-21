import AppKit
import SwiftUI

struct RootView: View {
    @ObservedObject var model: AppModel
    @ObservedObject var backend: BackendController

    var body: some View {
        ZStack {
            AppBackdrop()

            Group {
                if model.isBootstrapping {
                    ProgressView("Caruso Reborn wird vorbereitet...")
                        .controlSize(.large)
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else if !model.hasCompletedOnboarding {
                    OnboardingView(model: model, backend: backend)
                } else {
                    MainTabView(model: model, backend: backend)
                }
            }
            .padding(18)
        }
        .alert("Fehler", isPresented: Binding(
            get: { model.lastError != nil || backend.lastError != nil },
            set: { newValue in
                if !newValue {
                    model.lastError = nil
                    backend.clearError()
                }
            }
        )) {
            Button("OK") {
                model.lastError = nil
                backend.clearError()
            }
        } message: {
            Text(model.lastError ?? backend.lastError ?? "Unbekannter Fehler")
        }
    }
}

struct MainTabView: View {
    private enum AppTab: Hashable {
        case dashboard
        case settings
    }

    @ObservedObject var model: AppModel
    @ObservedObject var backend: BackendController
    @State private var selectedTab: AppTab = .dashboard

    var body: some View {
        TabView(selection: $selectedTab) {
            DashboardView(model: model, backend: backend)
                .tag(AppTab.dashboard)
                .tabItem {
                    Label("Dashboard", systemImage: "dot.radiowaves.left.and.right")
                }

            SettingsContentView(model: model, backend: backend, showStandaloneHeader: false)
                .tag(AppTab.settings)
                .tabItem {
                    Label("Einstellungen", systemImage: "slider.horizontal.3")
                }
        }
        .animation(.spring(response: 0.45, dampingFraction: 0.86), value: selectedTab)
    }
}

struct DashboardView: View {
    @ObservedObject var model: AppModel
    @ObservedObject var backend: BackendController

    private let metricsColumns = [
        GridItem(.flexible(minimum: 180), spacing: 14),
        GridItem(.flexible(minimum: 180), spacing: 14),
        GridItem(.flexible(minimum: 180), spacing: 14)
    ]

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                dashboardHero
                    .modifier(EntranceMotion(delay: 0.02))
                metricsSection
                    .modifier(EntranceMotion(delay: 0.08))
                statusSection
                    .modifier(EntranceMotion(delay: 0.14))
                rendererSection
                    .modifier(EntranceMotion(delay: 0.20))
                favoritesSection
                    .modifier(EntranceMotion(delay: 0.26))
                librarySection
                    .modifier(EntranceMotion(delay: 0.32))
            }
            .frame(maxWidth: 980)
            .padding(.horizontal, 12)
            .padding(.vertical, 18)
            .frame(maxWidth: .infinity)
        }
    }

    private var dashboardHero: some View {
        GlassPanel {
            HStack(alignment: .top, spacing: 18) {
                VStack(alignment: .leading, spacing: 10) {
                    Text("Caruso Reborn")
                        .font(.system(size: 36, weight: .bold, design: .rounded))
                    Text("Die native macOS-Zentrale für dein bestehendes Caruso-Reborn-Backend.")
                        .font(.title3)
                        .foregroundStyle(.secondary)
                    Label(backend.statusDescription, systemImage: backend.isRunning ? "checkmark.circle.fill" : "xmark.circle.fill")
                        .foregroundStyle(backend.isRunning ? .green : .orange)
                        .symbolEffect(.pulse.byLayer, isActive: backend.isRunning)
                }

                Spacer(minLength: 24)

                VStack(alignment: .trailing, spacing: 10) {
                    HStack(spacing: 10) {
                        AdaptiveButton("Web-Dashboard", prominent: false) {
                            model.openWebDashboard()
                        }

                        AdaptiveButton("Neu laden", prominent: true) {
                            Task {
                                await model.refreshAll()
                            }
                        }
                        .disabled(model.isBusy)
                    }

                    if let status = model.status {
                        Text(status.server.publicBaseURL)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                            .multilineTextAlignment(.trailing)
                            .textSelection(.enabled)
                    }
                }
            }
        }
    }

    private var metricsSection: some View {
        LazyVGrid(columns: metricsColumns, spacing: 14) {
            metricCard("Public URL", model.status?.server.publicBaseURL ?? "—")
            metricCard("Caruso", model.selectedDeviceName ?? "Noch keiner gewählt")
            metricCard("UPnP Name", model.status?.upnp.friendlyName ?? "—")
            metricCard("CPU", model.status.map { "\(String(format: "%.1f", $0.server.metrics.cpuUsagePercent)) %" } ?? "—")
            metricCard("RAM App", model.status?.server.metrics.processMemoryRss ?? "—")
            metricCard("Tracks", model.status.map { "\($0.library.trackCount)" } ?? "0")
        }
        .animation(.spring(response: 0.35, dampingFraction: 0.82), value: model.status?.server.metrics.cpuUsagePercent)
        .animation(.spring(response: 0.35, dampingFraction: 0.82), value: model.status?.library.trackCount)
    }

    private var statusSection: some View {
        GlassPanel {
            VStack(alignment: .leading, spacing: 14) {
                sectionHeader("Live-Status", subtitle: "Was der Caruso gerade macht.")

                VStack(spacing: 12) {
                    infoRow("Ausgewählter Caruso", model.selectedDeviceName ?? "Noch keiner ausgewählt")
                    infoRow("Transport", model.rendererStatus?.transportState ?? "Unbekannt")
                    infoRow("Quelle", model.rendererStatus?.title ?? "Keine Wiedergabe")
                    infoRow("Qualität", model.rendererStatus?.quality ?? "—")
                    infoRow("Position", model.rendererStatus?.relativeTimePosition ?? "—")
                }
            }
        }
    }

    private var rendererSection: some View {
        GlassPanel {
            VStack(alignment: .leading, spacing: 14) {
                HStack {
                    sectionHeader("Caruso / Renderer", subtitle: "Wähle das Zielgerät für Wiedergabe und Browsing.")
                    Spacer()
                    AdaptiveButton("Erneut suchen") {
                        Task {
                            await model.refreshAll()
                        }
                    }
                }

                if model.discoveredDevices.isEmpty {
                    ContentUnavailableView(
                        "Kein Caruso gefunden",
                        systemImage: "dot.radiowaves.left.and.right",
                        description: Text("Prüfe Netzwerk, Strom und ob der Caruso im gleichen LAN sichtbar ist.")
                    )
                } else {
                    VStack(spacing: 10) {
                        ForEach(model.discoveredDevices, id: \.id) { device in
                            GlassRow(selected: model.selectedDeviceURL == device.location) {
                                VStack(alignment: .leading, spacing: 4) {
                                    Text(device.displayName)
                                        .font(.headline)
                                    Text("\(device.description?.modelName ?? "Unbekannt") · \(device.address)")
                                        .font(.subheadline)
                                        .foregroundStyle(.secondary)
                                }
                            } trailing: {
                                AdaptiveButton(model.selectedDeviceURL == device.location ? "Ausgewählt" : "Auswählen", prominent: model.selectedDeviceURL != device.location) {
                                    Task {
                                        await model.saveSelectedRenderer(device)
                                    }
                                }
                                .disabled(model.selectedDeviceURL == device.location)
                            }
                        }
                    }
                    .animation(.spring(response: 0.42, dampingFraction: 0.84), value: model.discoveredDevices)
                }
            }
        }
    }

    private var favoritesSection: some View {
        GlassPanel {
            VStack(alignment: .leading, spacing: 14) {
                sectionHeader("Senderliste", subtitle: "Alles hier ist sofort am Caruso spielbar.")

                if let favorites = model.status?.tunein.favorites, !favorites.isEmpty {
                    VStack(spacing: 10) {
                        ForEach(favorites) { favorite in
                            GlassRow {
                                VStack(alignment: .leading, spacing: 4) {
                                    Text(favorite.title)
                                        .font(.headline)
                                    Text([favorite.subtitle, favorite.mimeType, favorite.bitrate.map { "\($0) kbps" }]
                                        .compactMap { $0 }
                                        .joined(separator: " · "))
                                    .font(.subheadline)
                                    .foregroundStyle(.secondary)
                                }
                            } trailing: {
                                AdaptiveButton("Jetzt spielen", prominent: true) {
                                    Task {
                                        await model.playFavorite(favorite)
                                    }
                                }
                            }
                        }
                    }
                    .animation(.spring(response: 0.42, dampingFraction: 0.84), value: favorites.map(\.id))
                } else {
                    Text("Noch keine Favoriten im Backend gespeichert.")
                        .foregroundStyle(.secondary)
                }
            }
        }
    }

    private var librarySection: some View {
        GlassPanel {
            VStack(alignment: .leading, spacing: 14) {
                HStack {
                    sectionHeader("Lokale Musik", subtitle: "Die ersten 80 Tracks für schnellen Zugriff.")
                    Spacer()
                    AdaptiveButton("Ordner hinzufügen", prominent: true) {
                        Task {
                            await model.chooseAndAddFolder()
                        }
                    }
                }

                if model.tracks.isEmpty {
                    Text("Noch keine lokalen Tracks gefunden.")
                        .foregroundStyle(.secondary)
                } else {
                    VStack(spacing: 10) {
                        ForEach(model.tracks.prefix(80)) { track in
                            GlassRow {
                                VStack(alignment: .leading, spacing: 4) {
                                    Text(track.title)
                                        .font(.headline)
                                    Text(track.relativePath)
                                        .font(.subheadline)
                                        .foregroundStyle(.secondary)
                                        .lineLimit(2)
                                }
                            } trailing: {
                                AdaptiveButton("Spielen", prominent: true) {
                                    Task {
                                        await model.playTrack(track)
                                    }
                                }
                            }
                        }
                    }
                    .animation(.spring(response: 0.42, dampingFraction: 0.84), value: model.tracks.map(\.id))
                }
            }
        }
    }

    private func metricCard(_ title: String, _ value: String) -> some View {
        GlassPanel(cornerRadius: 24, padding: 16) {
            VStack(alignment: .leading, spacing: 8) {
                Text(title)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                Text(value)
                    .font(.headline)
                    .textSelection(.enabled)
                    .lineLimit(3)
                    .contentTransition(.interpolate)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    private func infoRow(_ label: String, _ value: String) -> some View {
        HStack(alignment: .firstTextBaseline, spacing: 18) {
            Text(label)
                .foregroundStyle(.secondary)
                .frame(width: 170, alignment: .leading)
            Text(value)
                .textSelection(.enabled)
            Spacer()
        }
    }
}

struct SettingsSceneView: View {
    @ObservedObject var model: AppModel
    @ObservedObject var backend: BackendController

    var body: some View {
        SettingsContentView(model: model, backend: backend, showStandaloneHeader: true)
            .padding(18)
            .background(AppBackdrop())
    }
}

struct SettingsContentView: View {
    @ObservedObject var model: AppModel
    @ObservedObject var backend: BackendController
    let showStandaloneHeader: Bool

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                if showStandaloneHeader {
                    GlassPanel {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Settings")
                                .font(.system(size: 32, weight: .bold, design: .rounded))
                            Text("Netzwerk, Caruso und Backend-Verhalten später erneut anpassen.")
                                .foregroundStyle(.secondary)
                        }
                    }
                    .modifier(EntranceMotion(delay: 0.02))
                }

                GlassPanel {
                    VStack(alignment: .leading, spacing: 14) {
                        sectionHeader("Allgemein", subtitle: "Die Sprache folgt automatisch der macOS-Systemsprache.")

                        Grid(alignment: .leading, horizontalSpacing: 18, verticalSpacing: 14) {
                            GridRow {
                                Text("Caruso Filter")
                                    .foregroundStyle(.secondary)
                                TextField("Caruso", text: $model.rendererFilterName)
                            }
                            GridRow {
                                Text("Deezer ARL")
                                    .foregroundStyle(.secondary)
                                SecureField("Optional", text: $model.deezerARL)
                            }
                        }
                    }
                }
                .modifier(EntranceMotion(delay: 0.08))

                GlassPanel {
                    VStack(alignment: .leading, spacing: 14) {
                        sectionHeader("Netzwerk", subtitle: "Hier kannst du später jederzeit den aktiven Adapter wechseln.")

                        if model.networkCandidates.isEmpty {
                            Text("Noch keine Adapter vom Backend geladen.")
                                .foregroundStyle(.secondary)
                        } else {
                            Picker("Adapter", selection: Binding(
                                get: { model.selectedNetworkCandidateID ?? "" },
                                set: { model.selectedNetworkCandidateID = $0 }
                            )) {
                                ForEach(model.networkCandidates, id: \.id) { candidate in
                                    Text("\(candidate.interfaceName) · \(candidate.address)\(candidate.isVirtual ? " · VPN/virtuell" : "")")
                                        .tag(candidate.id)
                                }
                            }
                            .labelsHidden()

                            if let selected = model.selectedNetworkCandidate {
                                Text(selected.baseURL)
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                                    .textSelection(.enabled)
                            }
                        }
                    }
                }
                .modifier(EntranceMotion(delay: 0.14))

                GlassPanel {
                    VStack(alignment: .leading, spacing: 14) {
                        sectionHeader("Musikordner", subtitle: "Lokale Quellen für den Caruso-Browser.")

                        AdaptiveButton("Ordner hinzufügen", prominent: true) {
                            Task {
                                await model.chooseAndAddFolder()
                            }
                        }

                        VStack(spacing: 10) {
                            ForEach(model.status?.library.folders ?? [], id: \.self) { folder in
                                GlassRow {
                                    Text(folder)
                                        .textSelection(.enabled)
                                } trailing: {
                                    AdaptiveButton("Entfernen") {
                                        Task {
                                            await model.removeFolder(folder)
                                        }
                                    }
                                }
                            }
                        }
                        .animation(.spring(response: 0.42, dampingFraction: 0.84), value: model.status?.library.folders ?? [])
                    }
                }
                .modifier(EntranceMotion(delay: 0.20))

                GlassPanel {
                    VStack(alignment: .leading, spacing: 14) {
                        sectionHeader("Backend", subtitle: "Das Backend ist die eigentliche Caruso-Engine: Web-Dashboard, UPnP-Bridge, Discovery, Playback und Metadaten.")

                        Label(backend.statusDescription, systemImage: backend.isRunning ? "checkmark.circle.fill" : "xmark.circle.fill")
                            .foregroundStyle(backend.isRunning ? .green : .orange)

                        Text(backend.latestLogLine)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                            .textSelection(.enabled)

                        Text("Wenn die App ein schon laufendes Backend findet, kann sie es benutzen, aber nicht hart stoppen. Stoppen geht nur für ein Backend, das diese App selbst gestartet hat.")
                            .font(.caption)
                            .foregroundStyle(.secondary)

                        HStack(spacing: 10) {
                            AdaptiveButton(backend.isRunning ? "Backend-Status prüfen" : "Backend starten", prominent: true) {
                                Task {
                                    if backend.isRunning {
                                        await backend.refreshReachability()
                                    } else {
                                        await backend.startIfNeeded()
                                    }
                                    await model.refreshAll()
                                }
                            }

                            AdaptiveButton("Eigenes Backend stoppen") {
                                backend.stopOwnedBackend()
                            }
                            .disabled(!backend.canStopOwnedBackend)

                            AdaptiveButton("Web-Dashboard") {
                                model.openWebDashboard()
                            }

                            Spacer()

                            AdaptiveButton("Onboarding erneut zeigen") {
                                model.resetOnboarding()
                            }
                        }
                    }
                }
                .modifier(EntranceMotion(delay: 0.26))

                HStack {
                    Spacer()
                    AdaptiveButton("Speichern", prominent: true) {
                        Task {
                            await model.saveSettings()
                        }
                    }
                    .disabled(model.isBusy)
                }
            }
            .frame(maxWidth: 920)
            .padding(.horizontal, 12)
            .padding(.vertical, 18)
            .frame(maxWidth: .infinity)
        }
    }
}

struct OnboardingView: View {
    @ObservedObject var model: AppModel
    @ObservedObject var backend: BackendController

    @State private var step: OnboardingStep = .network

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                GlassPanel {
                    VStack(alignment: .leading, spacing: 16) {
                        HStack(alignment: .top) {
                            VStack(alignment: .leading, spacing: 8) {
                                Text("Caruso Reborn Setup")
                                    .font(.system(size: 38, weight: .bold, design: .rounded))
                                Text("Kurzes Mac-Setup für Netzwerk und deinen Caruso. Die Sprache folgt automatisch macOS.")
                                    .font(.title3)
                                    .foregroundStyle(.secondary)
                            }

                            Spacer()

                            Text("Schritt \(step.rawValue + 1) / \(OnboardingStep.allCases.count)")
                                .foregroundStyle(.secondary)
                        }

                        stepsBar
                    }
                }
                .modifier(EntranceMotion(delay: 0.02))

                contentCard
                    .id(step)
                    .transition(.asymmetric(insertion: .move(edge: .trailing).combined(with: .opacity), removal: .move(edge: .leading).combined(with: .opacity)))
                    .animation(.spring(response: 0.45, dampingFraction: 0.86), value: step)

                GlassPanel(cornerRadius: 28, padding: 18) {
                    HStack {
                        if let previous = step.previous {
                            AdaptiveButton("Zurück") {
                                step = previous
                            }
                        }

                        Spacer()

                        if step == .finish {
                            AdaptiveButton("Setup abschließen", prominent: true) {
                                Task {
                                    await model.completeOnboarding()
                                }
                            }
                            .disabled(model.isBusy)
                        } else if let next = step.next {
                            AdaptiveButton("Weiter", prominent: true) {
                                step = next
                            }
                        }
                    }
                }
                .modifier(EntranceMotion(delay: 0.10))
            }
            .frame(maxWidth: 920)
            .padding(.horizontal, 12)
            .padding(.vertical, 18)
            .frame(maxWidth: .infinity)
        }
    }

    private var stepsBar: some View {
        HStack(spacing: 10) {
            ForEach(OnboardingStep.allCases) { item in
                VStack(alignment: .leading, spacing: 8) {
                    Text(item.title)
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(item.rawValue <= step.rawValue ? .primary : .secondary)

                    Capsule()
                        .fill(item.rawValue <= step.rawValue ? Color.accentColor : Color.white.opacity(0.12))
                        .frame(height: 8)
                }
            }
        }
        .animation(.spring(response: 0.45, dampingFraction: 0.84), value: step)
    }

        @ViewBuilder
    private var contentCard: some View {
        switch step {
        case .network:
            GlassPanel {
                VStack(alignment: .leading, spacing: 16) {
                    sectionHeader("Netzwerk", subtitle: "Wähle den Adapter, über den dein Caruso die Bridge erreichen soll.")

                    if model.networkCandidates.isEmpty {
                        ProgressView("Netzwerkadapter werden geladen...")
                            .task {
                                await model.refreshAll()
                            }
                    } else {
                        VStack(spacing: 10) {
                            ForEach(model.networkCandidates, id: \.id) { candidate in
                                GlassRow(selected: model.selectedNetworkCandidateID == candidate.id) {
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text(candidate.interfaceName)
                                            .font(.headline)
                                        Text("\(candidate.address) · \(candidate.baseURL)")
                                            .font(.subheadline)
                                            .foregroundStyle(.secondary)
                                        if candidate.isVirtual {
                                            Text("Virtuell / VPN")
                                                .font(.caption)
                                                .foregroundStyle(.orange)
                                        }
                                    }
                                } trailing: {
                                    AdaptiveButton(model.selectedNetworkCandidateID == candidate.id ? "Ausgewählt" : "Wählen", prominent: model.selectedNetworkCandidateID != candidate.id) {
                                        model.selectedNetworkCandidateID = candidate.id
                                    }
                                    .disabled(model.selectedNetworkCandidateID == candidate.id)
                                }
                            }
                        }
                    }
                }
            }
        case .caruso:
            GlassPanel {
                VStack(alignment: .leading, spacing: 16) {
                    HStack {
                        sectionHeader("Caruso", subtitle: "Suche deinen Renderer im lokalen Netzwerk und speichere ihn für später.")
                        Spacer()
                        AdaptiveButton("Erneut suchen") {
                            Task {
                                await model.refreshAll()
                            }
                        }
                    }

                    if model.discoveredDevices.isEmpty {
                        ContentUnavailableView(
                            "Noch kein Caruso gefunden",
                            systemImage: "dot.radiowaves.left.and.right",
                            description: Text("Stelle sicher, dass Mac und Caruso im gleichen Netzwerk sind.")
                        )
                    } else {
                        VStack(spacing: 10) {
                            ForEach(model.discoveredDevices, id: \.id) { device in
                                GlassRow(selected: model.selectedDeviceURL == device.location) {
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text(device.displayName)
                                            .font(.headline)
                                        Text("\(device.description?.modelName ?? "Unbekannt") · \(device.address)")
                                            .font(.subheadline)
                                            .foregroundStyle(.secondary)
                                    }
                                } trailing: {
                                AdaptiveButton(model.selectedDeviceURL == device.location ? "Ausgewählt" : "Wählen", prominent: model.selectedDeviceURL != device.location) {
                                        model.selectedDevice(device)
                                    }
                                    .disabled(model.selectedDeviceURL == device.location)
                                }
                            }
                        }
                    }
                }
            }
        case .finish:
            GlassPanel {
                VStack(alignment: .leading, spacing: 16) {
                    sectionHeader("Fertig", subtitle: "Damit startet die native App direkt in Dashboard und Settings.")

                    VStack(spacing: 12) {
                        summaryRow("Netzwerk", model.selectedNetworkCandidate?.baseURL ?? "Nicht gesetzt")
                        summaryRow("Caruso", model.selectedDeviceName ?? "Nicht gesetzt")
                        summaryRow("Backend", backend.isRunning ? "Aktiv" : "Offline")
                    }
                }
            }
        }
    }

    private func summaryRow(_ label: String, _ value: String) -> some View {
        HStack(alignment: .firstTextBaseline, spacing: 18) {
            Text(label)
                .foregroundStyle(.secondary)
                .frame(width: 120, alignment: .leading)
            Text(value)
                .textSelection(.enabled)
            Spacer()
        }
    }
}

struct MenuBarExtraView: View {
    @Environment(\.openWindow) private var openWindow

    @ObservedObject var model: AppModel
    @ObservedObject var backend: BackendController

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Caruso Reborn")
                .font(.headline)
            Label(backend.statusDescription, systemImage: backend.isRunning ? "checkmark.circle.fill" : "xmark.circle.fill")
                .foregroundStyle(backend.isRunning ? .green : .orange)
            Text(model.selectedDeviceName ?? "Noch kein Caruso gewählt")
                .foregroundStyle(.secondary)
                .lineLimit(2)

            Divider()

            AdaptiveButton("App öffnen", prominent: true) {
                openWindow(id: "main")
            }

            AdaptiveButton("Web-Dashboard") {
                model.openWebDashboard()
            }

            AdaptiveButton("Einstellungen") {
                NSApp.sendAction(Selector(("showSettingsWindow:")), to: nil, from: nil)
            }

            AdaptiveButton("Aktualisieren") {
                Task {
                    await model.refreshAll()
                }
            }

            if backend.isRunning {
                AdaptiveButton("Eigenes Backend stoppen") {
                    backend.stopOwnedBackend()
                }
            } else {
                AdaptiveButton("Backend starten", prominent: true) {
                    Task {
                        await backend.startIfNeeded()
                        await model.refreshAll()
                    }
                }
            }
        }
        .padding(14)
        .frame(width: 280)
        .modifier(EntranceMotion(delay: 0.02))
    }
}

private struct AppBackdrop: View {
    var body: some View {
        ZStack {
            LinearGradient(
                colors: [
                    Color(red: 0.06, green: 0.08, blue: 0.12),
                    Color(red: 0.08, green: 0.07, blue: 0.10),
                    Color(red: 0.03, green: 0.04, blue: 0.06)
                ],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )

            Circle()
                .fill(Color.blue.opacity(0.24))
                .frame(width: 420, height: 420)
                .blur(radius: 80)
                .offset(x: -260, y: -180)

            Circle()
                .fill(Color.cyan.opacity(0.16))
                .frame(width: 360, height: 360)
                .blur(radius: 90)
                .offset(x: 280, y: -240)
        }
        .ignoresSafeArea()
    }
}

private struct GlassPanel<Content: View>: View {
    let cornerRadius: CGFloat
    let padding: CGFloat
    @ViewBuilder let content: Content

    init(cornerRadius: CGFloat = 30, padding: CGFloat = 22, @ViewBuilder content: () -> Content) {
        self.cornerRadius = cornerRadius
        self.padding = padding
        self.content = content()
    }

    var body: some View {
        Group {
            if #available(macOS 26.0, *) {
                content
                    .padding(padding)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color.white.opacity(0.001))
                    .glassEffect(.regular, in: .rect(cornerRadius: cornerRadius))
                    .overlay {
                        RoundedRectangle(cornerRadius: cornerRadius)
                            .stroke(Color.white.opacity(0.12), lineWidth: 1)
                    }
            } else {
                content
                    .padding(padding)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: cornerRadius))
                    .overlay {
                        RoundedRectangle(cornerRadius: cornerRadius)
                            .stroke(Color.white.opacity(0.10), lineWidth: 1)
                    }
            }
        }
    }
}

private struct GlassRow<Leading: View, Trailing: View>: View {
    let selected: Bool
    @ViewBuilder let leading: Leading
    @ViewBuilder let trailing: Trailing
    @State private var isHovering = false

    init(selected: Bool = false, @ViewBuilder leading: () -> Leading, @ViewBuilder trailing: () -> Trailing) {
        self.selected = selected
        self.leading = leading()
        self.trailing = trailing()
    }

    var body: some View {
        HStack(spacing: 14) {
            leading
            Spacer(minLength: 12)
            trailing
        }
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 22)
                .fill(selected ? Color.accentColor.opacity(0.14) : Color.white.opacity(0.04))
        )
        .overlay {
            RoundedRectangle(cornerRadius: 22)
                .stroke(selected ? Color.accentColor.opacity(0.45) : Color.white.opacity(0.08), lineWidth: 1)
        }
        .scaleEffect(isHovering ? 1.008 : 1)
        .offset(y: isHovering ? -1 : 0)
        .shadow(color: Color.black.opacity(isHovering ? 0.18 : 0.08), radius: isHovering ? 18 : 10, y: isHovering ? 10 : 6)
        .animation(.spring(response: 0.28, dampingFraction: 0.82), value: isHovering)
        .onHover { hovering in
            isHovering = hovering
        }
    }
}

private struct EntranceMotion: ViewModifier {
    let delay: Double
    @State private var isVisible = false

    func body(content: Content) -> some View {
        content
            .opacity(isVisible ? 1 : 0.001)
            .offset(y: isVisible ? 0 : 18)
            .scaleEffect(isVisible ? 1 : 0.985, anchor: .top)
            .task {
                guard !isVisible else { return }
                if delay > 0 {
                    try? await Task.sleep(for: .seconds(delay))
                }
                withAnimation(.spring(response: 0.52, dampingFraction: 0.84)) {
                    isVisible = true
                }
            }
    }
}

private struct AdaptiveButton: View {
    let title: String
    let prominent: Bool
    let action: () -> Void

    init(_ title: String, prominent: Bool = false, action: @escaping () -> Void) {
        self.title = title
        self.prominent = prominent
        self.action = action
    }

    var body: some View {
        Button(title, action: action)
            .controlSize(.large)
            .modifier(AdaptiveButtonStyleModifier(prominent: prominent))
    }
}

private struct AdaptiveButtonStyleModifier: ViewModifier {
    let prominent: Bool

    @ViewBuilder
    func body(content: Content) -> some View {
        if #available(macOS 26.0, *) {
            if prominent {
                content.buttonStyle(.glassProminent)
            } else {
                content.buttonStyle(.glass)
            }
        } else {
            if prominent {
                content.buttonStyle(.borderedProminent)
            } else {
                content.buttonStyle(.bordered)
            }
        }
    }
}

private func sectionHeader(_ title: String, subtitle: String) -> some View {
    VStack(alignment: .leading, spacing: 6) {
        Text(title)
            .font(.title2.weight(.semibold))
        Text(subtitle)
            .foregroundStyle(.secondary)
    }
}
