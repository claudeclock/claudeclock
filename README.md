# Claude Clock

See exactly when Claude's 2x bonus window is live in your timezone.

Anthropic is temporarily doubling Claude usage limits outside peak Pacific hours. Claude Clock converts that into your local timezone so you can see exactly when the bonus window is active. No account needed. No data collected.

**Live at [claudeclock.com](https://claudeclock.com)**

## Three ways to use it

### Web clock

Open [claudeclock.com/clock](https://claudeclock.com/clock) in your browser. No install required.

### Mac menu bar app

Keeps the bonus status visible in your menu bar all day. Includes notification support.

```bash
cd apps/menubar/ClaudeClock
bash build.sh
open .build/ClaudeClock.app
```

Builds a universal binary (x86_64 + arm64) for macOS 12+.

### Terminal CLI

```bash
npm i -g claudeclock
```

Quick check:
```
$ claudeclock
⚡ 2× ACTIVE — 4h 52m remaining
```

Live dashboard:
```
$ claudeclock --watch
```

JSON output (for scripts, tmux, etc.):
```
$ claudeclock --json
```

## Project structure

```
claudeclock/
├── apps/
│   ├── web/          # Next.js website + /clock page
│   ├── cli/          # npm CLI tool (Ink/React)
│   └── menubar/      # macOS SwiftUI menu bar app
├── packages/
│   └── core/         # Shared TypeScript promo logic
└── shared/
    └── promo-config.json
```

## Development

```bash
# Install dependencies
npm install

# Run website locally
cd apps/web && npm run dev -- -p 3333

# Run CLI in dev mode
cd apps/cli && npx tsx src/index.tsx

# Run tests
cd apps/cli && npm test

# Build Mac app
cd apps/menubar/ClaudeClock && bash build.sh
```

## How it works

The promo schedule is defined in `shared/promo-config.json`. Each app reads this config and calculates the current bonus window status based on your local timezone. Peak hours are weekdays 5-11 AM Pacific time. Outside those hours, usage limits are doubled.

The Mac app syncs the config from claudeclock.com once per day. The CLI and web app serve the config directly.

## Disclaimer

Claude Clock is an independent, free tool with no association with Anthropic, PBC. Claude is a product of Anthropic. This tool converts publicly available promotion schedule information into local timezone displays. It does not access, store, or transmit any user data.

## License

MIT
