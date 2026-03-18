import SwiftUI
import AppKit
import UserNotifications

class AppDelegate: NSObject, NSApplicationDelegate {
    var statusItem: NSStatusItem!
    var popover: NSPopover!
    var timer: Timer?
    var configLoader = ConfigLoader()
    var currentStatus = PromoStatus.inactive
    var notificationManager = NotificationManager()
    private var wasBonusActive = false

    func applicationDidFinishLaunching(_ notification: Notification) {
        statusItem = NSStatusBar.system.statusItem(withLength: NSStatusItem.variableLength)

        popover = NSPopover()
        popover.contentSize = NSSize(width: 290, height: 380)
        popover.behavior = .transient
        updatePopoverContent()

        if let button = statusItem.button {
            button.title = "\u{23F8} \u{2014}"
            button.action = #selector(togglePopover)
            button.target = self
        }

        notificationManager.requestPermission()

        timer = Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { [weak self] _ in
            self?.updateStatus()
        }
    }

    func applicationWillTerminate(_ notification: Notification) {
        timer?.invalidate()
    }

    func updateStatus() {
        guard let config = configLoader.config else { return }
        let previousStatus = currentStatus
        currentStatus = PromoStatusCalculator.getPromoStatus(config: config)

        if let button = statusItem.button {
            button.title = menuBarTitle
        }

        // Notification triggers
        if currentStatus.hasActivePromo {
            // Notify when 2× window starts
            if currentStatus.bonusActive && !wasBonusActive && notificationManager.notifyOnBonusStart {
                notificationManager.send(
                    title: "\u{26A1} 2\u{00D7} bonus window is live",
                    body: "Claude usage limits are doubled. \(PromoStatusCalculator.formatDuration(currentStatus.minutesRemaining)) remaining."
                )
            }
            // Notify 30 min before bonus ends
            if currentStatus.bonusActive && notificationManager.notifyBeforeBonusEnd {
                if previousStatus.minutesRemaining > 30 && currentStatus.minutesRemaining <= 30 && currentStatus.minutesRemaining > 29 {
                    notificationManager.send(
                        title: "\u{23F3} 30 minutes left on 2\u{00D7} window",
                        body: "Bonus window ends at \(currentStatus.windowEnd.map { PromoStatusCalculator.formatTimeOnly($0) } ?? "soon")."
                    )
                }
            }
        }
        wasBonusActive = currentStatus.bonusActive

        updatePopoverContent()
    }

    func updatePopoverContent() {
        let view = MenuBarDropdown(
            status: currentStatus,
            lastSyncDate: configLoader.lastSyncDate,
            syncFailed: configLoader.syncFailed,
            notificationManager: notificationManager
        )
        popover.contentViewController = NSHostingController(rootView: view)
    }

    var menuBarTitle: String {
        if !currentStatus.hasActivePromo { return "\u{23F8} \u{2014}" }
        if currentStatus.bonusActive {
            return "\u{26A1} \(currentStatus.multiplier)\u{00D7} \(PromoStatusCalculator.formatDuration(currentStatus.minutesRemaining))"
        }
        return "\u{1F634} \(PromoStatusCalculator.formatDuration(currentStatus.minutesUntilBonus)) \u{2192} \u{26A1}\(currentStatus.multiplier)\u{00D7}"
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
