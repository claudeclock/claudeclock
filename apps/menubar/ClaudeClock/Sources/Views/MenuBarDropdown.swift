import SwiftUI

struct MenuBarDropdown: View {
    let status: PromoStatus
    let lastSyncDate: Date?
    let syncFailed: Bool
    @ObservedObject var notificationManager: NotificationManager

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Header
            headerSection

            sectionDivider

            if !status.hasActivePromo {
                noPromoView
            } else if status.bonusActive {
                bonusActiveView
            } else {
                peakHoursView
            }

            // Schedule
            if status.hasActivePromo {
                sectionDivider
                scheduleSection
            }

            // Notifications
            sectionDivider
            notificationSection

            // Footer
            sectionDivider
            footerSection
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .frame(width: 290)
    }

    // MARK: - Header

    private var headerSection: some View {
        HStack {
            HStack(spacing: 6) {
                Text("\u{26A1}")
                    .font(.system(size: 14))
                Text("Claude Clock")
                    .font(.system(size: 13, weight: .semibold))
            }
            Spacer()
            Text(currentTimezoneAbbrev())
                .font(.system(size: 10, weight: .medium))
                .foregroundColor(.secondary)
                .padding(.horizontal, 6)
                .padding(.vertical, 2)
                .background(Color.gray.opacity(0.15))
                .cornerRadius(4)
        }
        .padding(.bottom, 4)
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
        .padding(.vertical, 8)
    }

    private var bonusActiveView: some View {
        VStack(alignment: .leading, spacing: 8) {
            // Status line
            HStack(spacing: 8) {
                HStack(spacing: 5) {
                    Circle()
                        .fill(Color.green)
                        .frame(width: 7, height: 7)
                    Text("2\u{00D7} bonus window")
                        .font(.system(size: 13, weight: .semibold))
                }
                Text("ACTIVE")
                    .font(.system(size: 9, weight: .bold))
                    .foregroundColor(.white)
                    .padding(.horizontal, 6)
                    .padding(.vertical, 2)
                    .background(Color.green)
                    .cornerRadius(4)
            }

            // Hero countdown
            HStack(alignment: .firstTextBaseline, spacing: 6) {
                Text(PromoStatusCalculator.formatDuration(status.minutesRemaining))
                    .font(.system(size: 28, weight: .bold, design: .rounded))
                Text("remaining")
                    .font(.system(size: 12))
                    .foregroundColor(.secondary)
            }

            // Progress bar
            GeometryReader { geometry in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 3)
                        .fill(Color.gray.opacity(0.2))
                        .frame(height: 5)
                    RoundedRectangle(cornerRadius: 3)
                        .fill(Color.green)
                        .frame(width: max(0, geometry.size.width * CGFloat(status.bonusProgress)), height: 5)
                }
            }
            .frame(height: 5)

            // End time
            if let end = status.windowEnd {
                Text("Ends \(PromoStatusCalculator.formatTimeOnly(end)) your time (\(currentTimezoneAbbrev()))")
                    .font(.system(size: 11))
                    .foregroundColor(.secondary)
            }
        }
        .padding(.vertical, 8)
    }

    private var peakHoursView: some View {
        VStack(alignment: .leading, spacing: 8) {
            // Status line
            HStack(spacing: 8) {
                HStack(spacing: 5) {
                    Circle()
                        .fill(Color.orange)
                        .frame(width: 7, height: 7)
                    Text("Peak hours")
                        .font(.system(size: 13, weight: .semibold))
                }
                Text("1\u{00D7}")
                    .font(.system(size: 9, weight: .bold))
                    .foregroundColor(.white)
                    .padding(.horizontal, 6)
                    .padding(.vertical, 2)
                    .background(Color.orange)
                    .cornerRadius(4)
            }

            // Hero countdown
            HStack(alignment: .firstTextBaseline, spacing: 6) {
                Text(PromoStatusCalculator.formatDuration(status.minutesUntilBonus))
                    .font(.system(size: 28, weight: .bold, design: .rounded))
                Text("until 2\u{00D7} resumes")
                    .font(.system(size: 12))
                    .foregroundColor(.secondary)
            }

            if let next = status.nextBonusStart {
                Text("Resumes \(PromoStatusCalculator.formatTimeOnly(next)) your time (\(currentTimezoneAbbrev()))")
                    .font(.system(size: 11))
                    .foregroundColor(.secondary)
            }
        }
        .padding(.vertical, 8)
    }

    // MARK: - Schedule

    private var scheduleSection: some View {
        VStack(alignment: .leading, spacing: 5) {
            Text("SCHEDULE")
                .font(.system(size: 9, weight: .semibold, design: .default))
                .foregroundColor(Color.secondary.opacity(0.7))
                .tracking(1)
                .padding(.top, 4)

            if let nextStart = status.nextWindowStart {
                scheduleRow(
                    label: "Next 2\u{00D7} window",
                    value: "\(PromoStatusCalculator.formatRelativeDay(nextStart)), \(PromoStatusCalculator.formatTimeOnly(nextStart))"
                )
            }

            if let nextStart = status.nextWindowStart,
               let nextEnd = status.nextWindowEnd {
                let duration = Int(nextEnd.timeIntervalSince(nextStart) / 60)
                scheduleRow(label: "Duration", value: PromoStatusCalculator.formatDuration(duration))
            }

            if let promoEnd = status.promoEndDate {
                scheduleRow(label: "Promo ends", value: formatShortDate(promoEnd))
            }
        }
        .padding(.bottom, 4)
    }

    private func scheduleRow(label: String, value: String) -> some View {
        HStack {
            Text(label)
                .font(.system(size: 11))
                .foregroundColor(.secondary)
            Spacer()
            Text(value)
                .font(.system(size: 11, weight: .medium))
        }
    }

    // MARK: - Notifications

    private var notificationSection: some View {
        VStack(alignment: .leading, spacing: 5) {
            Text("NOTIFICATIONS")
                .font(.system(size: 9, weight: .semibold, design: .default))
                .foregroundColor(Color.secondary.opacity(0.7))
                .tracking(1)
                .padding(.top, 4)

            Toggle(isOn: Binding(
                get: { notificationManager.notifyOnBonusStart },
                set: { notificationManager.notifyOnBonusStart = $0 }
            )) {
                Text("When 2\u{00D7} window starts")
                    .font(.system(size: 11))
            }
            .toggleStyle(.switch)
            .controlSize(.mini)

            Toggle(isOn: Binding(
                get: { notificationManager.notifyBeforeBonusEnd },
                set: { notificationManager.notifyBeforeBonusEnd = $0 }
            )) {
                Text("30 min before window ends")
                    .font(.system(size: 11))
            }
            .toggleStyle(.switch)
            .controlSize(.mini)
        }
        .padding(.bottom, 4)
    }

    // MARK: - Footer

    private var footerSection: some View {
        HStack(spacing: 8) {
            // Sync indicator
            HStack(spacing: 3) {
                Circle()
                    .fill(syncFailed ? Color.orange : Color.green)
                    .frame(width: 4, height: 4)
                Text(syncFailed ? "Offline" : "Synced")
                    .font(.system(size: 9))
                    .foregroundColor(Color.secondary.opacity(0.7))
            }

            Spacer()

            // Links
            Button(action: {
                if let url = URL(string: "https://claudeclock.com/clock") {
                    NSWorkspace.shared.open(url)
                }
            }) {
                Text("Web clock")
                    .font(.system(size: 9))
                    .foregroundColor(.accentColor)
            }
            .buttonStyle(.plain)

            if let promo = status.promo, let url = URL(string: promo.infoUrl) {
                Text("\u{00B7}")
                    .font(.system(size: 9))
                    .foregroundColor(Color.secondary.opacity(0.4))
                Button(action: { NSWorkspace.shared.open(url) }) {
                    Text("Details")
                        .font(.system(size: 9))
                        .foregroundColor(.accentColor)
                }
                .buttonStyle(.plain)
            }

            Text("\u{00B7}")
                .font(.system(size: 9))
                .foregroundColor(Color.secondary.opacity(0.4))

            Button(action: { NSApplication.shared.terminate(nil) }) {
                Text("Quit")
                    .font(.system(size: 9))
                    .foregroundColor(Color.secondary.opacity(0.7))
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
