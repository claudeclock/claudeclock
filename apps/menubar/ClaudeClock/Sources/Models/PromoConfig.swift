import Foundation

struct PromoConfig: Codable {
    let version: Int
    let promos: [Promo]
}

struct Promo: Codable {
    let id: String
    let name: String
    let description: String
    let multiplier: Int
    let startDate: String
    let endDate: String
    let peakHours: PeakHours
    let eligiblePlans: [String]
    let infoUrl: String
}

struct PeakHours: Codable {
    let timezone: String
    let weekdaysOnly: Bool
    let start: String
    let end: String
}
