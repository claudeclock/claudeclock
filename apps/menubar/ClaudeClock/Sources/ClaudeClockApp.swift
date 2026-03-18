import SwiftUI
import Combine

@main
struct ClaudeClockApp: App {
    @StateObject private var viewModel = AppViewModel()

    var body: some Scene {
        MenuBarExtra {
            MenuBarDropdown(status: viewModel.status)
        } label: {
            Text(viewModel.menuBarTitle)
        }
    }
}

class AppViewModel: ObservableObject {
    @Published var status = PromoStatus.inactive

    private let configLoader = ConfigLoader()
    private var cancellables = Set<AnyCancellable>()
    private var tickTimer: Timer?

    init() {
        // React to config changes
        configLoader.$config
            .receive(on: RunLoop.main)
            .sink { [weak self] _ in self?.updateStatus() }
            .store(in: &cancellables)

        // Tick every second
        tickTimer = Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { [weak self] _ in
            self?.updateStatus()
        }
    }

    deinit {
        tickTimer?.invalidate()
    }

    var menuBarTitle: String {
        if !status.hasActivePromo { return "\u{23F8} \u{2014}" }
        if status.bonusActive {
            return "\u{26A1}\(status.multiplier)X \(PromoStatusCalculator.formatDuration(status.minutesRemaining))"
        }
        return "\u{1F4A4}1X \(PromoStatusCalculator.formatDuration(status.minutesUntilBonus))\u{2192}\u{26A1}"
    }

    private func updateStatus() {
        guard let config = configLoader.config else { return }
        status = PromoStatusCalculator.getPromoStatus(config: config)
    }
}
