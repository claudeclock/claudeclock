// swift-tools-version: 5.7.1
import PackageDescription

let package = Package(
    name: "ClaudeClock",
    platforms: [.macOS(.v13)],
    targets: [
        .executableTarget(
            name: "ClaudeClock",
            path: "Sources",
            exclude: ["Info.plist"]
        )
    ]
)
