import Foundation
import UserNotifications

class NotificationManager: ObservableObject {
    @Published var notifyOnBonusStart: Bool {
        didSet { UserDefaults.standard.set(notifyOnBonusStart, forKey: "notifyOnBonusStart") }
    }
    @Published var notifyBeforeBonusEnd: Bool {
        didSet { UserDefaults.standard.set(notifyBeforeBonusEnd, forKey: "notifyBeforeBonusEnd") }
    }

    init() {
        self.notifyOnBonusStart = UserDefaults.standard.object(forKey: "notifyOnBonusStart") as? Bool ?? false
        self.notifyBeforeBonusEnd = UserDefaults.standard.object(forKey: "notifyBeforeBonusEnd") as? Bool ?? false
    }

    func requestPermission() {
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound]) { _, _ in }
    }

    func send(title: String, body: String) {
        let content = UNMutableNotificationContent()
        content.title = title
        content.body = body
        content.sound = .default

        let request = UNNotificationRequest(
            identifier: UUID().uuidString,
            content: content,
            trigger: nil // fire immediately
        )
        UNUserNotificationCenter.current().add(request)
    }
}
