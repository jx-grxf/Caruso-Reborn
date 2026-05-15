import Foundation

enum BackendProcessService {
    static func runProcess(
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

        let outputTask = Task {
            try pipe.fileHandleForReading.readToEnd() ?? Data()
        }

        try process.run()

        await withCheckedContinuation { continuation in
            process.terminationHandler = { _ in
                continuation.resume()
            }
        }

        if process.terminationStatus == 0 {
            _ = try? await outputTask.value
            return
        }

        let data = (try? await outputTask.value) ?? Data()
        let message = String(data: data, encoding: .utf8)?.trimmingCharacters(in: .whitespacesAndNewlines)
        throw NSError(
            domain: "CarusoRebornMac",
            code: Int(process.terminationStatus),
            userInfo: [NSLocalizedDescriptionKey: message?.isEmpty == false ? message! : "Backend-Build fehlgeschlagen."]
        )
    }
}
