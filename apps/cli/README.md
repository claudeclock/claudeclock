# @claudeclock/run

See exactly when Claude's 2× bonus window is live in your timezone.

Anthropic is temporarily doubling Claude usage limits outside peak Pacific hours. This CLI converts that into your local timezone — no guesswork, no conversion math.

## Install

```bash
npm i -g @claudeclock/run
```

## Usage

```bash
# Quick status check
claudeclock
# ⚡ 2× active — 4h 52m remaining

# Live dashboard (updates every second)
claudeclock --watch

# JSON output (for scripts and integrations)
claudeclock --json
```

## What you get

- **Instant status** — is the 2× bonus window active right now?
- **Countdown** — how long until it ends (or starts)
- **Watch mode** — live-updating terminal dashboard
- **JSON mode** — pipe into other tools or scripts
- **Auto timezone** — detects your local timezone automatically

## Also available as

- **Web clock** — [claudeclock.com/clock](https://claudeclock.com/clock)
- **Mac menu bar app** — [Download DMG](https://github.com/claudeclock/claudeclock/releases/latest/download/ClaudeClock.dmg)

## Who benefits most?

Anyone outside US Pacific hours — especially APAC (New Zealand, Australia, Japan, Korea, Southeast Asia). Your working day overlaps with the bonus window.

## Promo details

- **Period**: Through March 28, 2026
- **Bonus hours**: Outside weekdays 5–11 AM PT
- **Eligible plans**: Free, Pro, Max, Team (not Enterprise)
- **Source**: [Anthropic support article](https://support.claude.com/en/articles/14063676-claude-march-2026-usage-promotion)

## Disclaimer

Claude Clock is an independent, free tool with no association with Anthropic, PBC. It simply converts publicly available promotion schedule information into local timezone displays.

## License

MIT
