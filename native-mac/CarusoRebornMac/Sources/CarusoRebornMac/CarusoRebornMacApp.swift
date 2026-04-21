import SwiftUI

@main
struct CarusoRebornMacApp: App {
    @StateObject private var backend: BackendController
    @StateObject private var model: AppModel

    init() {
        let backend = BackendController()
        _backend = StateObject(wrappedValue: backend)
        _model = StateObject(wrappedValue: AppModel(backend: backend))
    }

    var body: some Scene {
        WindowGroup("Caruso Reborn", id: "main") {
            RootView(model: model, backend: backend)
                .frame(minWidth: 1100, minHeight: 760)
                .task {
                    await model.bootstrap()
                }
        }

        Settings {
            SettingsSceneView(model: model, backend: backend)
                .frame(width: 760, height: 620)
        }

        MenuBarExtra("Caruso Reborn", systemImage: "dot.radiowaves.left.and.right") {
            MenuBarExtraView(model: model, backend: backend)
        }
        .menuBarExtraStyle(.window)
    }
}
