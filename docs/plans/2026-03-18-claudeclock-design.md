# Claude Clock — Design Document

**Date:** 2026-03-18
**Status:** Approved

## Problem

Anthropic's March 2026 promotion gives 2x usage limits outside peak hours (5-11 AM PT weekdays). For NZ/AU/APAC users, peak hours translate to roughly 1 AM - 7 AM local time — meaning their entire working day falls in the bonus window. But there's no easy way to see when you're in the bonus window or when it ends.

## Solution

Claude Clock: a set of tools that show bonus window status at a glance.

**Three deliverables shipping together:**
1. macOS Menu Bar App (Swift/SwiftUI)
2. Terminal TUI Dashboard (Node.js/TypeScript, npm-installable)
3. claudeclock.com (Next.js on Vercel — landing page, API, web clock)

## Promo Config (Remote JSON)

All apps fetch promo definitions from `claudeclock.com/api/promo.json`. This makes the system reusable — when Anthropic runs future promos, update the JSON and every running instance picks it up within an hour.

```json
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
```

- Fetched on app launch, cached locally
- Polling interval: once per hour
- Graceful fallback to cached config if network unavailable

## macOS Menu Bar App

**Menu bar display (always visible):**
- Bonus active: `⚡2X 3h42m`
- Peak/no bonus: `💤 1X 2h18m→⚡`
- No active promo: `⏸ —`

**Dropdown panel on click:**
- Bonus status with progress bar (% through current window)
- Bonus end time and time remaining
- Next window start time
- Promo end date
- User's plan + eligibility
- Optional notification toggle (15/30min before bonus ends)
- Link to claudeclock.com, Quit button

**Behaviors:**
- Auto-detects system timezone
- All times displayed in local timezone
- Green tint when bonus active, gray when not
- Plan preference saved locally

**Tech:** Swift/SwiftUI, targeting macOS 13+. Distributed as .dmg from claudeclock.com.

## Terminal TUI Dashboard

**Package:** `npm install -g claudeclock`

**Quick check mode:** `claudeclock`
```
⚡ BONUS ACTIVE — 2x usage for 3h 42m
  Window: 12:00 AM – 2:00 PM NZDT (weekdays)
  Promo ends: Mar 28, 2026
```

**Live dashboard mode:** `claudeclock --watch` or `claudeclock -w`
- Full-screen TUI with box-drawing characters
- Live-updating status, progress bar, countdown
- `q` to quit

**Additional flags:**
- `--json` — machine-readable output (for tmux, shell prompts, Raycast, etc.)
- `--notify` — system notification when bonus starts/ends
- `--plan <plan>` — set plan type (saved to `~/.claudeclock`)

**Tech:** Node.js/TypeScript with ink (React for CLIs).

## claudeclock.com (Vercel)

**Next.js site with three functions:**

1. **Landing page** (`/`) — explains Claude Clock, shows live promo status, download links (macOS .dmg + npm command). Hero message: "Your working day IS the bonus window."

2. **API endpoint** (`/api/promo`) — serves promo config JSON. Source of truth for all apps.

3. **Live web clock** (`/clock`) — browser-based version of the TUI. Works for anyone, serves as the "web users" path.

## Project Structure

```
claudeclock/
├── apps/
│   ├── menubar/          # Swift/SwiftUI macOS menu bar app
│   │   ├── ClaudeClock/
│   │   └── ClaudeClock.xcodeproj
│   ├── cli/              # Node.js/TypeScript TUI
│   │   ├── src/
│   │   ├── package.json  # published as "claudeclock" on npm
│   │   └── tsconfig.json
│   └── web/              # Next.js site (claudeclock.com)
│       ├── app/
│       │   ├── page.tsx           # landing page
│       │   ├── clock/page.tsx     # live web clock
│       │   └── api/promo/route.ts # serves promo.json
│       ├── public/
│       │   └── downloads/         # .dmg for menu bar app
│       └── package.json
├── shared/
│   └── promo-config.json  # source of truth for promo data
└── README.md
```

## Core Algorithm

Identical logic in Swift and TypeScript:

1. Fetch promo config, find active promo (current date within start/end range)
2. Convert peak hours from config timezone to user's local timezone
3. Check: is today a weekday? Is current time outside peak hours?
4. If yes: bonus active — calculate time remaining until peak starts
5. If no: standard rate — calculate time until peak ends (bonus resumes)

## Distribution

- **Menu bar app:** .dmg download from claudeclock.com
- **CLI:** `npm install -g claudeclock`
- **Website:** claudeclock.com on Vercel

## Target Users

Primary: Claude Code users in NZ/AU/APAC timezones.
Secondary: Any Claude user who wants to maximize the bonus window.
