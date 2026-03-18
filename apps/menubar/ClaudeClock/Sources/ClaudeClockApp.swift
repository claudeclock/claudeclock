import SwiftUI
import AppKit

class AppDelegate: NSObject, NSApplicationDelegate {
    var statusItem: NSStatusItem!
    var popover: NSPopover!
    var timer: Timer?
    var configLoader = ConfigLoader()
    var currentStatus = PromoStatus.inactive

    func applicationDidFinishLaunching(_ notification: Notification) {
        statusItem = NSStatusBar.system.statusItem(withLength: NSStatusItem.variableLength)

        popover = NSPopover()
        popover.contentSize = NSSize(width: 280, height: 340)
        popover.behavior = .transient
        updatePopoverContent()

        if let button = statusItem.button {
            button.title = "\u{23F8} \u{2014}"
            button.action = #selector(togglePopover)
            button.target = self
        }

        timer = Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { [weak self] _ in
            self?.updateStatus()
        }
    }

    func applicationWillTerminate(_ notification: Notification) {
        timer?.invalidate()
    }

    func updateStatus() {
        guard let config = configLoader.config else { return }
        currentStatus = PromoStatusCalculator.getPromoStatus(config: config)

        if let button = statusItem.button {
            button.title = menuBarTitle
        }

        updatePopoverContent()
    }

    func updatePopoverContent() {
        let view = MenuBarDropdown(
            status: currentStatus,
            lastSyncDate: configLoader.lastSyncDate,
            syncFailed: configLoader.syncFailed
        )
        popover.contentViewController = NSHostingController(rootView: view)
    }

    var menuBarTitle: String {
        if !currentStatus.hasActivePromo { return "\u{23F8} \u{2014}" }
        if currentStatus.bonusActive {
            return "\u{26A1}\(currentStatus.multiplier)X \(PromoStatusCalculator.formatDuration(currentStatus.minutesRemaining))"
        }
        return "\u{1F4A4}1X \(PromoStatusCalculator.formatDuration(currentStatus.minutesUntilBonus))\u{2192}\u{26A1}"
    }

    @objc func togglePopover() {
        guard let button = statusItem.button else { return }
        if popover.isShown {
            popover.performClose(nil)
        } else {
            popover.show(relativeTo: button.bounds, of: button, preferredEdge: .minY)
        }
    }
}

@main
struct ClaudeClockApp {
    static func main() {
        let app = NSApplication.shared
        let delegate = AppDelegate()
        app.delegate = delegate
        app.setActivationPolicy(.accessory)
        app.run()
    }
}
