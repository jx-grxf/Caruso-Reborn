import Foundation

enum AppLanguage: String, CaseIterable, Codable, Identifiable {
    case de
    case en

    var id: String { rawValue }

    var label: String {
        switch self {
        case .de:
            "Deutsch"
        case .en:
            "English"
        }
    }

    static var systemDefault: AppLanguage {
        let identifier = Locale.autoupdatingCurrent.language.languageCode?.identifier ?? Locale.autoupdatingCurrent.identifier
        return identifier.lowercased().hasPrefix("de") ? .de : .en
    }
}

enum TargetPlatformOption: String, CaseIterable, Codable, Identifiable {
    case mac
    case windows

    var id: String { rawValue }

    var label: String {
        switch self {
        case .mac:
            "Mac"
        case .windows:
            "Windows"
        }
    }
}

enum OnboardingStep: Int, CaseIterable, Identifiable {
    case network
    case caruso
    case finish

    var id: Int { rawValue }

    var title: String {
        switch self {
        case .network:
            "Netzwerk"
        case .caruso:
            "Caruso"
        case .finish:
            "Fertig"
        }
    }

    var next: OnboardingStep? {
        OnboardingStep(rawValue: rawValue + 1)
    }

    var previous: OnboardingStep? {
        OnboardingStep(rawValue: rawValue - 1)
    }
}

struct StatusResponse: Decodable {
    let server: ServerInfo
    let upnp: UpnpInfo
    let config: BackendConfig
    let library: LibraryInfo
    let tunein: TuneInInfo
    let deezer: DeezerInfo
}

struct ServerInfo: Decodable {
    let running: Bool
    let startedAt: String
    let publicBaseURL: String
    let dataDir: String
    let metrics: ServerMetrics

    enum CodingKeys: String, CodingKey {
        case running
        case startedAt
        case publicBaseURL = "publicBaseUrl"
        case dataDir
        case metrics
    }
}

struct ServerMetrics: Decodable {
    let cpuUsagePercent: Double
    let processMemoryRss: String
    let processHeapUsed: String
    let systemMemoryUsed: String
    let systemMemoryTotal: String
    let uptimeSeconds: Int
    let loadAverage1m: Double
    let platform: String
    let hostname: String
    let cpuCores: Int
}

struct UpnpInfo: Decodable {
    let enabled: Bool
    let friendlyName: String
    let deviceDescriptionURL: String

    enum CodingKeys: String, CodingKey {
        case enabled
        case friendlyName
        case deviceDescriptionURL = "deviceDescriptionUrl"
    }
}

struct BackendConfig: Codable {
    let publicBaseURL: String?
    let carusoFriendlyName: String?
    let rendererFilterName: String?
    let deezerArl: String?
    let uiLanguage: AppLanguage?
    let targetPlatform: TargetPlatformOption?

    enum CodingKeys: String, CodingKey {
        case publicBaseURL = "publicBaseUrl"
        case carusoFriendlyName
        case rendererFilterName
        case deezerArl
        case uiLanguage
        case targetPlatform
    }
}

struct LibraryInfo: Decodable {
    let folders: [String]
    let trackCount: Int
}

struct TuneInInfo: Decodable {
    let favorites: [FavoriteStation]
}

struct DeezerInfo: Decodable {
    let available: Bool?
    let warning: String
}

struct FavoriteStation: Decodable, Identifiable {
    let id: String
    let title: String
    let streamURL: String
    let subtitle: String?
    let image: String?
    let mimeType: String?
    let bitrate: Int?

    enum CodingKeys: String, CodingKey {
        case id
        case title
        case streamURL = "streamUrl"
        case subtitle
        case image
        case mimeType
        case bitrate
    }
}

struct DeviceDiscoveryResponse: Decodable {
    let devices: [DiscoveredDevice]
}

struct DiscoveredDevice: Decodable, Identifiable, Hashable {
    let address: String
    let location: String?
    let description: DeviceDescription?

    var id: String {
        location ?? "\(address)-\(description?.friendlyName ?? "device")"
    }

    var displayName: String {
        description?.friendlyName ?? location ?? address
    }
}

struct DeviceDescription: Decodable, Hashable {
    let friendlyName: String?
    let manufacturer: String?
    let modelName: String?
    let services: [DeviceService]
}

struct DeviceService: Decodable, Hashable {
    let serviceType: String
}

struct RendererStatusEnvelope: Decodable {
    let status: RendererStatus
}

struct RendererStatus: Decodable {
    let transportState: String?
    let title: String?
    let quality: String?
    let relativeTimePosition: String?
    let currentURI: String?
    let currentTrackURI: String?

    enum CodingKeys: String, CodingKey {
        case transportState
        case title
        case quality
        case relativeTimePosition
        case currentURI = "currentUri"
        case currentTrackURI = "currentTrackUri"
    }
}

struct TracksResponse: Decodable {
    let items: [LocalTrack]
}

struct LocalTrack: Decodable, Identifiable {
    let id: String
    let title: String
    let relativePath: String
    let absolutePath: String
    let folder: String
    let `extension`: String
    let size: Int
    let url: String
}

struct FoldersResponse: Decodable {
    let folders: [String]
}

struct NetworkCandidatesResponse: Decodable {
    let candidates: [NetworkCandidate]
    let recommendedAddress: String?
    let recommendedInterfaceName: String?
}

struct NetworkSelectionResponse: Decodable {
    let selection: PersistedNetworkSelection
    let candidates: [NetworkCandidate]
    let recommendedAddress: String?
}

struct PersistedNetworkSelection: Decodable {
    let publicBaseURL: String
    let interfaceName: String
    let address: String
    let mode: String

    enum CodingKeys: String, CodingKey {
        case publicBaseURL = "publicBaseUrl"
        case interfaceName
        case address
        case mode
    }
}

struct NetworkCandidate: Decodable, Identifiable, Hashable {
    let interfaceName: String
    let address: String
    let baseURL: String
    let isVirtual: Bool
    let priority: Int

    var id: String {
        "\(interfaceName)|\(address)"
    }

    enum CodingKeys: String, CodingKey {
        case interfaceName
        case address
        case baseURL = "baseUrl"
        case isVirtual
        case priority
    }
}

struct ErrorPayload: Decodable {
    let error: String
}

struct ConfigUpdatePayload: Encodable {
    let publicBaseURL: String?
    let rendererFilterName: String?
    let deezerArl: String?
    let uiLanguage: AppLanguage
    let targetPlatform: TargetPlatformOption

    enum CodingKeys: String, CodingKey {
        case publicBaseURL = "publicBaseUrl"
        case rendererFilterName
        case deezerArl
        case uiLanguage
        case targetPlatform
    }
}

struct NetworkSelectionPayload: Encodable {
    let interfaceName: String
    let address: String
    let mode: String
}

struct PlayFavoritePayload: Encodable {
    let deviceDescriptionURL: String
    let title: String
    let streamURL: String
    let bitrate: Int?
    let mimeType: String?

    enum CodingKeys: String, CodingKey {
        case deviceDescriptionURL = "deviceDescriptionUrl"
        case title
        case streamURL = "streamUrl"
        case bitrate
        case mimeType
    }
}

struct PlayLocalPayload: Encodable {
    let deviceDescriptionURL: String
    let trackID: String

    enum CodingKeys: String, CodingKey {
        case deviceDescriptionURL = "deviceDescriptionUrl"
        case trackID = "trackId"
    }
}

struct PlayFavoriteResponse: Decodable {
    let ok: Bool
    let proxiedStreamURL: String?

    enum CodingKeys: String, CodingKey {
        case ok
        case proxiedStreamURL = "proxiedStreamUrl"
    }
}

struct PlayLocalResponse: Decodable {
    let ok: Bool
    let track: LocalTrack
}
