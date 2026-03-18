import Foundation

enum PromoStatusCalculator {

    // MARK: - Public API

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
        let weekday = comps.weekday ?? 1

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
            if peak.weekdaysOnly {
                var daysUntilNextPeak = 0
                if isDuringWeekday && currentMinutesInDay < peakStartMinutes {
                    daysUntilNextPeak = 0
                } else if isDuringWeekday && currentMinutesInDay >= peakEndMinutes {
                    daysUntilNextPeak = 1
                    var nextDay = nextWeekdayVal(weekday)
                    while !isWeekday(nextDay) {
                        daysUntilNextPeak += 1
                        nextDay = nextWeekdayVal(nextDay)
                    }
                } else {
                    daysUntilNextPeak = 1
                    var nextDay = nextWeekdayVal(weekday)
                    while !isWeekday(nextDay) {
                        daysUntilNextPeak += 1
                        nextDay = nextWeekdayVal(nextDay)
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
                totalWindowMinutes = (24 * 60 - peakEndMinutes) + (2 * 24 * 60) + peakStartMinutes
            } else {
                totalWindowMinutes = (24 * 60) - (peakEndMinutes - peakStartMinutes)
            }
            if totalWindowMinutes > 0 {
                bonusProgress = min(1.0, 1.0 - Double(minutesRemaining) / Double(totalWindowMinutes))
            }
        }

        // Calculate next window (for planning - even when bonus is active)
        let (nextWinStart, nextWinEnd) = calculateNextWindow(
            cal: cal, now: now, weekday: weekday,
            currentMinutesInDay: currentMinutesInDay,
            peakStartMinutes: peakStartMinutes, peakEndMinutes: peakEndMinutes,
            peakStart: peakStart, peakEnd: peakEnd,
            weekdaysOnly: peak.weekdaysOnly, bonusActive: bonusActive
        )

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
            bonusProgress: bonusProgress,
            nextWindowStart: nextWinStart,
            nextWindowEnd: nextWinEnd
        )
    }

    // MARK: - Formatting

    static func formatDuration(_ totalMinutes: Int) -> String {
        if totalMinutes <= 0 { return "0m" }
        let hours = totalMinutes / 60
        let minutes = totalMinutes % 60
        if hours == 0 { return "\(minutes)m" }
        if minutes == 0 { return "\(hours)h" }
        return "\(hours)h \(minutes)m"
    }

    static func formatLocalTime(_ date: Date) -> String {
        let fmt = DateFormatter()
        fmt.dateFormat = "h:mm a zzz"
        return fmt.string(from: date)
    }

    static func formatTimeOnly(_ date: Date) -> String {
        let fmt = DateFormatter()
        fmt.dateFormat = "h:mm a"
        return fmt.string(from: date)
    }

    static func formatRelativeDay(_ date: Date) -> String {
        let cal = Calendar.current
        if cal.isDateInToday(date) {
            return "Today"
        } else if cal.isDateInTomorrow(date) {
            return "Tomorrow"
        } else {
            let fmt = DateFormatter()
            fmt.dateFormat = "EEEE" // "Monday", "Tuesday", etc.
            return fmt.string(from: date)
        }
    }

    static func formatSyncAge(_ date: Date) -> String {
        let seconds = Int(-date.timeIntervalSinceNow)
        if seconds < 5 { return "just now" }
        if seconds < 60 { return "\(seconds)s ago" }
        let minutes = seconds / 60
        if minutes < 60 { return "\(minutes)m ago" }
        let hours = minutes / 60
        return "\(hours)h ago"
    }

    // MARK: - Next window calculation

    private static func calculateNextWindow(
        cal: Calendar, now: Date, weekday: Int,
        currentMinutesInDay: Int,
        peakStartMinutes: Int, peakEndMinutes: Int,
        peakStart: (hours: Int, minutes: Int),
        peakEnd: (hours: Int, minutes: Int),
        weekdaysOnly: Bool, bonusActive: Bool
    ) -> (start: Date?, end: Date?) {
        if bonusActive {
            // Currently in bonus. Next window = after the upcoming peak ends.
            // First find when next peak starts
            var daysToNextPeak = 0
            let isDuringWd = isWeekday(weekday)
            if weekdaysOnly {
                if isDuringWd && currentMinutesInDay < peakStartMinutes {
                    // Peak is later today, next bonus is after that peak
                    daysToNextPeak = 0
                } else {
                    // Peak is tomorrow or next weekday
                    daysToNextPeak = 1
                    var nd = nextWeekdayVal(weekday)
                    while weekdaysOnly && !isWeekday(nd) {
                        daysToNextPeak += 1
                        nd = nextWeekdayVal(nd)
                    }
                }
            } else {
                daysToNextPeak = currentMinutesInDay >= peakEndMinutes ? 1 : 0
            }

            // Next bonus starts when that peak ends
            let nextBonusStartDate = dateInTimezone(
                cal: cal, baseDate: now,
                daysOffset: daysToNextPeak,
                hours: peakEnd.hours, minutes: peakEnd.minutes
            )

            // Next bonus ends when the following peak starts
            var daysToFollowingPeak = daysToNextPeak + 1
            if weekdaysOnly {
                var nd = nextWeekdayVal(weekday)
                // Advance to the weekday after the next peak
                for _ in 0..<daysToNextPeak { nd = nextWeekdayVal(nd) }
                if !isWeekday(nd) {
                    while !isWeekday(nd) {
                        daysToFollowingPeak += 1
                        nd = nextWeekdayVal(nd)
                    }
                }
            }
            let nextBonusEndDate = dateInTimezone(
                cal: cal, baseDate: now,
                daysOffset: daysToFollowingPeak,
                hours: peakStart.hours, minutes: peakStart.minutes
            )

            return (nextBonusStartDate, nextBonusEndDate)
        } else {
            // Currently in peak. Next bonus starts when peak ends (today).
            // That window ends when next peak starts.
            let bonusStartDate = dateInTimezone(
                cal: cal, baseDate: now,
                daysOffset: 0,
                hours: peakEnd.hours, minutes: peakEnd.minutes
            )

            var daysToNextPeak = 1
            if weekdaysOnly {
                var nd = nextWeekdayVal(weekday)
                while !isWeekday(nd) {
                    daysToNextPeak += 1
                    nd = nextWeekdayVal(nd)
                }
            }
            let bonusEndDate = dateInTimezone(
                cal: cal, baseDate: now,
                daysOffset: daysToNextPeak,
                hours: peakStart.hours, minutes: peakStart.minutes
            )

            return (bonusStartDate, bonusEndDate)
        }
    }

    // MARK: - Private helpers

    private static func parseTime(_ time: String) -> (hours: Int, minutes: Int) {
        let parts = time.split(separator: ":").map { Int($0) ?? 0 }
        return (hours: parts.count > 0 ? parts[0] : 0, minutes: parts.count > 1 ? parts[1] : 0)
    }

    private static func isWeekday(_ calWeekday: Int) -> Bool {
        return calWeekday >= 2 && calWeekday <= 6
    }

    private static func nextWeekdayVal(_ wd: Int) -> Int {
        return wd == 7 ? 1 : wd + 1
    }

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
