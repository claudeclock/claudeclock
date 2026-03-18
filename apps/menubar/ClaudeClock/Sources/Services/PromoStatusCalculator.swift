import Foundation

enum PromoStatusCalculator {

    // MARK: - Public API

    /// Find the first promo whose date range contains `now`.
    static func getActivePromo(config: PromoConfig, now: Date = Date()) -> Promo? {
        let ts = now.timeIntervalSince1970
        let iso = ISO8601DateFormatter()
        iso.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        let isoBasic = ISO8601DateFormatter()
        isoBasic.formatOptions = [.withInternetDateTime]

        for promo in config.promos {
            guard let start = isoBasic.date(from: promo.startDate) ?? iso.date(from: promo.startDate),
                  let end = isoBasic.date(from: promo.endDate) ?? iso.date(from: promo.endDate) else {
                continue
            }
            if ts >= start.timeIntervalSince1970 && ts <= end.timeIntervalSince1970 {
                return promo
            }
        }
        return nil
    }

    /// Get full promo status for the given config and time.
    static func getPromoStatus(config: PromoConfig, now: Date = Date()) -> PromoStatus {
        guard let promo = getActivePromo(config: config, now: now) else {
            return .inactive
        }

        let peak = promo.peakHours
        guard let tz = TimeZone(identifier: peak.timezone) else {
            return .inactive
        }

        var cal = Calendar(identifier: .gregorian)
        cal.timeZone = tz

        let comps = cal.dateComponents([.year, .month, .day, .hour, .minute, .weekday], from: now)
        let currentMinutesInDay = (comps.hour ?? 0) * 60 + (comps.minute ?? 0)
        let weekday = comps.weekday ?? 1 // 1=Sun, 7=Sat

        let peakStart = parseTime(peak.start)
        let peakEnd = parseTime(peak.end)
        let peakStartMinutes = peakStart.hours * 60 + peakStart.minutes
        let peakEndMinutes = peakEnd.hours * 60 + peakEnd.minutes

        let isoFmt = ISO8601DateFormatter()
        isoFmt.formatOptions = [.withInternetDateTime]
        let promoEndDate = isoFmt.date(from: promo.endDate)

        let isDuringWeekday = isWeekday(weekday)
        let isInPeakTimeRange = currentMinutesInDay >= peakStartMinutes && currentMinutesInDay < peakEndMinutes
        let peakActive = peak.weekdaysOnly ? (isDuringWeekday && isInPeakTimeRange) : isInPeakTimeRange
        let bonusActive = !peakActive
        let multiplier = bonusActive ? promo.multiplier : 1

        var minutesRemaining = 0
        var minutesUntilBonus = 0
        var windowEnd: Date?
        var nextBonusStart: Date?

        if bonusActive {
            // Find next peak start
            if peak.weekdaysOnly {
                var daysUntilNextPeak = 0
                if isDuringWeekday && currentMinutesInDay < peakStartMinutes {
                    daysUntilNextPeak = 0
                } else if isDuringWeekday && currentMinutesInDay >= peakEndMinutes {
                    daysUntilNextPeak = 1
                    var nextDay = nextWeekday(weekday)
                    while !isWeekday(nextDay) {
                        daysUntilNextPeak += 1
                        nextDay = nextWeekdayFrom(nextDay)
                    }
                } else {
                    // Weekend
                    daysUntilNextPeak = 1
                    var nextDay = nextWeekday(weekday)
                    while !isWeekday(nextDay) {
                        daysUntilNextPeak += 1
                        nextDay = nextWeekdayFrom(nextDay)
                    }
                }

                let nextPeakDate = dateInTimezone(
                    cal: cal, baseDate: now,
                    daysOffset: daysUntilNextPeak,
                    hours: peakStart.hours, minutes: peakStart.minutes
                )
                let effectiveEnd = min(nextPeakDate, promoEndDate ?? nextPeakDate)
                minutesRemaining = max(0, Int(effectiveEnd.timeIntervalSince(now) / 60))
                windowEnd = effectiveEnd
            } else {
                var daysUntilPeak = 0
                if currentMinutesInDay >= peakEndMinutes {
                    daysUntilPeak = 1
                }
                let nextPeakDate = dateInTimezone(
                    cal: cal, baseDate: now,
                    daysOffset: daysUntilPeak,
                    hours: peakStart.hours, minutes: peakStart.minutes
                )
                let effectiveEnd = min(nextPeakDate, promoEndDate ?? nextPeakDate)
                minutesRemaining = max(0, Int(effectiveEnd.timeIntervalSince(now) / 60))
                windowEnd = effectiveEnd
            }
        } else {
            // Peak active - find when bonus starts (peak end today)
            let peakEndDate = dateInTimezone(
                cal: cal, baseDate: now,
                daysOffset: 0,
                hours: peakEnd.hours, minutes: peakEnd.minutes
            )
            minutesUntilBonus = max(0, Int(peakEndDate.timeIntervalSince(now) / 60))
            nextBonusStart = peakEndDate
        }

        // Calculate progress
        var bonusProgress = 0.0
        if bonusActive && minutesRemaining > 0 {
            let totalWindowMinutes: Int
            if peak.weekdaysOnly && !isDuringWeekday {
                _ = peakEndMinutes - peakStartMinutes // peak duration (unused directly)
                totalWindowMinutes = (24 * 60 - peakEndMinutes) + (2 * 24 * 60) + peakStartMinutes
            } else {
                totalWindowMinutes = (24 * 60) - (peakEndMinutes - peakStartMinutes)
            }
            if totalWindowMinutes > 0 {
                bonusProgress = min(1.0, 1.0 - Double(minutesRemaining) / Double(totalWindowMinutes))
            }
        }

        return PromoStatus(
            hasActivePromo: true,
            promo: promo,
            bonusActive: bonusActive,
            multiplier: multiplier,
            minutesRemaining: minutesRemaining,
            minutesUntilBonus: minutesUntilBonus,
            windowEnd: windowEnd,
            nextBonusStart: nextBonusStart,
            promoEndDate: promoEndDate,
            bonusProgress: bonusProgress
        )
    }

    /// Format a duration in minutes as "Xh Ym".
    static func formatDuration(_ totalMinutes: Int) -> String {
        if totalMinutes <= 0 { return "0m" }
        let hours = totalMinutes / 60
        let minutes = totalMinutes % 60
        if hours == 0 { return "\(minutes)m" }
        return "\(hours)h \(minutes)m"
    }

    /// Format a date as local time string.
    static func formatLocalTime(_ date: Date) -> String {
        let fmt = DateFormatter()
        fmt.dateFormat = "h:mm a zzz"
        return fmt.string(from: date)
    }

    // MARK: - Private helpers

    private static func parseTime(_ time: String) -> (hours: Int, minutes: Int) {
        let parts = time.split(separator: ":").map { Int($0) ?? 0 }
        return (hours: parts.count > 0 ? parts[0] : 0, minutes: parts.count > 1 ? parts[1] : 0)
    }

    /// Calendar weekday: 1=Sun .. 7=Sat.  isWeekday = Mon-Fri = 2..6
    private static func isWeekday(_ calWeekday: Int) -> Bool {
        return calWeekday >= 2 && calWeekday <= 6
    }

    /// Move one day forward in Calendar weekday space (1-7 wrapping).
    private static func nextWeekday(_ wd: Int) -> Int {
        return wd == 7 ? 1 : wd + 1
    }

    private static func nextWeekdayFrom(_ wd: Int) -> Int {
        return nextWeekday(wd)
    }

    /// Build a Date by taking baseDate's year/month/day in `cal`'s timezone,
    /// adding `daysOffset`, and setting hours/minutes.
    private static func dateInTimezone(
        cal: Calendar, baseDate: Date,
        daysOffset: Int, hours: Int, minutes: Int
    ) -> Date {
        var comps = cal.dateComponents([.year, .month, .day], from: baseDate)
        comps.hour = hours
        comps.minute = minutes
        comps.second = 0
        guard let base = cal.date(from: comps) else { return baseDate }
        return cal.date(byAdding: .day, value: daysOffset, to: base) ?? base
    }
}
