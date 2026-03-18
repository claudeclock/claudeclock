import Foundation
import Combine

class ConfigLoader: ObservableObject {
    @Published var config: PromoConfig?
    @Published var lastSyncDate: Date?
    @Published var syncFailed: Bool = false

    private var refreshTimer: Timer?
    private let configURL = URL(string: "https://claudeclock.com/api/promo")!

    init() {
        loadFallbackConfig()
        fetchRemoteConfig()
        startPeriodicRefresh()
    }

    deinit {
        refreshTimer?.invalidate()
    }

    func fetchRemoteConfig() {
        let request = URLRequest(url: configURL, cachePolicy: .reloadIgnoringLocalCacheData, timeoutInterval: 10)
        URLSession.shared.dataTask(with: request) { [weak self] data, response, error in
            DispatchQueue.main.async {
                guard let data = data, error == nil else {
                    self?.syncFailed = true
                    return
                }
                if let decoded = try? JSONDecoder().decode(PromoConfig.self, from: data) {
                    self?.config = decoded
                    self?.lastSyncDate = Date()
                    self?.syncFailed = false
                } else {
                    self?.syncFailed = true
                }
            }
        }.resume()
    }

    private func startPeriodicRefresh() {
        // Check once per 24 hours — the promo config rarely changes
        refreshTimer = Timer.scheduledTimer(withTimeInterval: 86400, repeats: true) { [weak self] _ in
            self?.fetchRemoteConfig()
        }
    }

    private func loadFallbackConfig() {
        let json = """
        {
          "version": 1,
          "promos": [
            {
              "id": "march-2026-double",
              "name": "March 2026 Double Usage",
              "description": "2x usage limits outside peak hours",
              "multiplier": 2,
              "startDate": "2026-03-13T00:00:00-07:00",
              "endDate": "2026-03-28T23:59:00-07:00",
              "peakHours": {
                "timezone": "America/Los_Angeles",
                "weekdaysOnly": true,
                "start": "05:00",
                "end": "11:00"
              },
              "eligiblePlans": ["free", "pro", "max", "team"],
              "infoUrl": "https://support.claude.com/en/articles/14063676-claude-march-2026-usage-promotion"
            }
          ]
        }
        """
        if let data = json.data(using: .utf8),
           let decoded = try? JSONDecoder().decode(PromoConfig.self, from: data) {
            self.config = decoded
            self.lastSyncDate = Date()
        }
    }
}
