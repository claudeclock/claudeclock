import Foundation

struct PromoStatus {
    let hasActivePromo: Bool
    let promo: Promo?
    let bonusActive: Bool
    let multiplier: Int
    let minutesRemaining: Int
    let minutesUntilBonus: Int
    let windowEnd: Date?
    let nextBonusStart: Date?
    let promoEndDate: Date?
    let bonusProgress: Double

    static let inactive = PromoStatus(
        hasActivePromo: false,
        promo: nil,
        bonusActive: false,
        multiplier: 1,
        minutesRemaining: 0,
        minutesUntilBonus: 0,
        windowEnd: nil,
        nextBonusStart: nil,
        promoEndDate: nil,
        bonusProgress: 0
    )
}
