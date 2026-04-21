// swift-tools-version: 6.3
// The swift-tools-version declares the minimum version of Swift required to build this package.

import PackageDescription

let package = Package(
    name: "CarusoRebornMac",
    platforms: [
        .macOS(.v14)
    ],
    targets: [
        .executableTarget(
            name: "CarusoRebornMac"
        ),
        .testTarget(
            name: "CarusoRebornMacTests",
            dependencies: ["CarusoRebornMac"]
        ),
    ],
    swiftLanguageModes: [.v6]
)
