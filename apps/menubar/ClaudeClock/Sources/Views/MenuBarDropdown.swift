import SwiftUI

struct MenuBarDropdown: View {
    let status: PromoStatus
    let lastSyncDate: Date?
    let syncFailed: Bool

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            if !status.hasActivePromo {
                noPromoView
            } else if status.bonusActive {
                bonusActiveView
            } else {
                peakHoursView
            }

            // Planning section
            if status.hasActivePromo {
                sectionDivider
                planningSection
            }

            // Links
            sectionDivider
            linksSection

            // Footer with sync status
            sectionDivider
            footerSection
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 10)
        .frame(width: 280)
    }

    // MARK: - Status Views

    private var noPromoView: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("No active promotion")
                .font(.system(size: 13, weight: .medium))
                .foregroundColor(.secondary)
            Text("Check claudeclock.com for updates")
                .font(.system(size: 11))
                .foregroundColor(.secondary)
        }
        .padding(.vertical, 4)
    }

    private var bonusActiveView: some View {
        VStack(alignment: .leading, spacing: 6) {
            // Status badge
            HStack(spacing: 6) {
                Text("2x usage limits")
                    .font(.system(size: 15, weight: .semibold))
                Text("ACTIVE")
                    .font(.system(size: 10, weight: .bold))
                    .foregroundColor(.white)
                    .padding(.horizontal, 6)
                    .padding(.vertical, 2)
                    .background(Color.green)
                    .cornerRadius(4)
            }

            // Time remaining - the hero number
            Text("\(PromoStatusCalculator.formatDuration(status.minutesRemaining)) remaining")
                .font(.system(size: 13))
                .foregroundColor(.secondary)

            // Progress bar
            GeometryReader { geometry in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 3)
                        .fill(Color.gray.opacity(0.3))
                        .frame(height: 6)
                    RoundedRectangle(cornerRadius: 3)
                        .fill(Color.green)
                        .frame(width: max(0, geometry.size.width * CGFloat(status.bonusProgress)), height: 6)
                }
            }
            .frame(height: 6)

            // End time with timezone clarity
            if let end = status.windowEnd {
                Text("Ends \(PromoStatusCalculator.formatTimeOnly(end)) your time")
                    .font(.system(size: 11))
                    .foregroundColor(.secondary)
            }
        }
        .padding(.vertical, 4)
    }

    private var peakHoursView: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack(spacing: 6) {
                Text("Standard usage")
                    .font(.system(size: 15, weight: .semibold))
                Text("PEAK")
                    .font(.system(size: 10, weight: .bold))
                    .foregroundColor(.white)
                    .padding(.horizontal, 6)
                    .padding(.vertical, 2)
                    .background(Color.orange)
                    .cornerRadius(4)
            }

            if let next = status.nextBonusStart {
                Text("2x starts in \(PromoStatusCalculator.formatDuration(status.minutesUntilBonus))")
                    .font(.system(size: 13))
                    .foregroundColor(.secondary)

                Text("Resumes \(PromoStatusCalculator.formatTimeOnly(next)) your time")
                    .font(.system(size: 11))
                    .foregroundColor(.secondary)
            }
        }
        .padding(.vertical, 4)
    }

    // MARK: - Planning Section

    private var planningSection: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("Upcoming")
                .font(.system(size: 10, weight: .semibold))
                .foregroundColor(.secondary)
                .textCase(.uppercase)
                .padding(.top, 4)

            if let nextStart = status.nextWindowStart,
               let nextEnd = status.nextWindowEnd {
                HStack {
                    Text("Next 2x window")
                        .font(.system(size: 12))
                    Spacer()
                    Text("\(PromoStatusCalculator.formatRelativeDay(nextStart)), \(PromoStatusCalculator.formatTimeOnly(nextStart))")
                        .font(.system(size: 12))
                        .foregroundColor(.secondary)
                }

                HStack {
                    Text("Window duration")
                        .font(.system(size: 12))
                    Spacer()
                    let duration = Int(nextEnd.timeIntervalSince(nextStart) / 60)
                    Text(PromoStatusCalculator.formatDuration(duration))
                        .font(.system(size: 12))
                        .foregroundColor(.secondary)
                }
            }

            if let promoEnd = status.promoEndDate {
                HStack {
                    Text("Promo ends")
                        .font(.system(size: 12))
                    Spacer()
                    Text(formatShortDate(promoEnd))
                        .font(.system(size: 12))
                        .foregroundColor(.secondary)
                }
            }
        }
        .padding(.bottom, 4)
    }

    // MARK: - Links

    private var linksSection: some View {
        VStack(alignment: .leading, spacing: 2) {
            if let promo = status.promo, let url = URL(string: promo.infoUrl) {
                Button(action: { NSWorkspace.shared.open(url) }) {
                    Text("View current promo")
                        .font(.system(size: 12))
                }
                .buttonStyle(.plain)
                .foregroundColor(.accentColor)
                .padding(.vertical, 2)
            }

            Button(action: {
                if let url = URL(string: "https://claudeclock.com") {
                    NSWorkspace.shared.open(url)
                }
            }) {
                Text("claudeclock.com")
                    .font(.system(size: 12))
            }
            .buttonStyle(.plain)
            .foregroundColor(.accentColor)
            .padding(.vertical, 2)
        }
        .padding(.vertical, 2)
    }

    // MARK: - Footer

    private var footerSection: some View {
        HStack {
            // Sync status
            if syncFailed {
                HStack(spacing: 3) {
                    Circle()
                        .fill(Color.orange)
                        .frame(width: 5, height: 5)
                    Text("Offline \u{00B7} using cached data")
                        .font(.system(size: 10))
                        .foregroundColor(.secondary)
                }
            } else {
                HStack(spacing: 3) {
                    Circle()
                        .fill(Color.green)
                        .frame(width: 5, height: 5)
                    Text("Synced")
                        .font(.system(size: 10))
                        .foregroundColor(.secondary)
                }
            }

            Spacer()

            // Timezone indicator
            Text(currentTimezoneAbbrev())
                .font(.system(size: 10))
                .foregroundColor(.secondary)

            // Quit
            Button(action: { NSApplication.shared.terminate(nil) }) {
                Text("Quit")
                    .font(.system(size: 10))
                    .foregroundColor(.secondary)
            }
            .buttonStyle(.plain)
        }
        .padding(.vertical, 4)
    }

    // MARK: - Divider

    private var sectionDivider: some View {
        Divider()
            .padding(.vertical, 4)
    }

    // MARK: - Helpers

    private func formatShortDate(_ date: Date) -> String {
        let fmt = DateFormatter()
        fmt.dateFormat = "MMM d"
        return fmt.string(from: date)
    }

    private func currentTimezoneAbbrev() -> String {
        return TimeZone.current.abbreviation() ?? TimeZone.current.identifier
    }
}
