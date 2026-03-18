import SwiftUI

struct MenuBarDropdown: View {
    let status: PromoStatus

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            if !status.hasActivePromo {
                noPromoView
            } else if status.bonusActive {
                bonusActiveView
            } else {
                standardRateView
            }

            Divider()

            if let endDate = status.promoEndDate {
                Text("Promo ends: \(formattedDate(endDate))")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Button("Open claudeclock.com") {
                if let url = URL(string: "https://claudeclock.com") {
                    NSWorkspace.shared.open(url)
                }
            }

            if let promo = status.promo, let url = URL(string: promo.infoUrl) {
                Button("Promo Details") {
                    NSWorkspace.shared.open(url)
                }
            }

            Divider()

            Button("Quit ClaudeClock") {
                NSApplication.shared.terminate(nil)
            }
            .keyboardShortcut("q")
        }
        .padding(.vertical, 4)
    }

    // MARK: - Subviews

    private var noPromoView: some View {
        VStack(alignment: .leading, spacing: 2) {
            Label("No Active Promotion", systemImage: "pause.circle")
                .font(.headline)
                .foregroundColor(.secondary)
            Text("Check back later for bonus windows.")
                .font(.caption)
                .foregroundColor(.secondary)
        }
    }

    private var bonusActiveView: some View {
        VStack(alignment: .leading, spacing: 4) {
            Label("Double Tokens: ACTIVE", systemImage: "bolt.fill")
                .font(.headline)
                .foregroundColor(.green)

            Text("\(status.multiplier)X usage right now")
                .font(.subheadline)
                .foregroundColor(.green)

            ProgressView(value: status.bonusProgress)
                .tint(.green)

            if let end = status.windowEnd {
                Text("Ends at \(PromoStatusCalculator.formatLocalTime(end))")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Text("\(PromoStatusCalculator.formatDuration(status.minutesRemaining)) remaining")
                .font(.caption)
                .foregroundColor(.secondary)
        }
    }

    private var standardRateView: some View {
        VStack(alignment: .leading, spacing: 4) {
            Label("Standard Rate", systemImage: "moon.fill")
                .font(.headline)
                .foregroundColor(.yellow)

            Text("1X usage (peak hours)")
                .font(.subheadline)
                .foregroundColor(.secondary)

            if let next = status.nextBonusStart {
                Text("Bonus starts at \(PromoStatusCalculator.formatLocalTime(next))")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Text("\(PromoStatusCalculator.formatDuration(status.minutesUntilBonus)) until bonus")
                .font(.caption)
                .foregroundColor(.secondary)
        }
    }

    // MARK: - Helpers

    private func formattedDate(_ date: Date) -> String {
        let fmt = DateFormatter()
        fmt.dateStyle = .medium
        fmt.timeStyle = .short
        return fmt.string(from: date)
    }
}
