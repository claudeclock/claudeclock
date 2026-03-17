# Claude Clock Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a bonus-window monitoring tool (menu bar app + CLI + website) so NZ/AU/APAC Claude users can see when they're in the 2x token bonus window.

**Architecture:** Three apps sharing a remote promo config. Core time-calculation logic in TypeScript (shared between CLI and web) and duplicated in Swift (menu bar). All apps fetch promo definitions from claudeclock.com/api/promo.json.

**Tech Stack:** TypeScript, Node.js, ink (React for CLIs), Next.js 14 (App Router), Swift/SwiftUI, Vercel.

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json` (root workspace)
- Create: `shared/promo-config.json`
- Create: `apps/cli/package.json`
- Create: `apps/cli/tsconfig.json`
- Create: `apps/web/package.json`
- Create: `.gitignore`

**Step 1: Create root package.json with npm workspaces**

```json
{
  "name": "claudeclock",
  "private": true,
  "workspaces": ["apps/cli", "apps/web"]
}
```

**Step 2: Create the shared promo config**

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

**Step 3: Create apps/cli/package.json**

```json
{
  "name": "claudeclock",
  "version": "1.0.0",
  "description": "See when you're in the Claude 2x bonus window",
  "bin": {
    "claudeclock": "./dist/index.js"
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsx src/index.tsx",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "keywords": ["claude", "anthropic", "tokens", "bonus", "cli"],
  "license": "MIT",
  "dependencies": {
    "ink": "^5.1.0",
    "react": "^18.3.1",
    "meow": "^13.0.0",
    "conf": "^13.0.0",
    "node-notifier": "^10.0.1"
  },
  "devDependencies": {
    "@types/react": "^18.3.0",
    "@types/node": "^22.0.0",
    "typescript": "^5.7.0",
    "tsx": "^4.19.0",
    "vitest": "^3.0.0",
    "ink-testing-library": "^4.0.0"
  }
}
```

**Step 4: Create apps/cli/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "jsx": "react-jsx",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "declaration": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Step 5: Initialize Next.js web app**

Run: `cd apps/web && npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=no --import-alias="@/*" --use-npm`

Then clean out boilerplate (delete default page content, globals.css defaults).

**Step 6: Create .gitignore**

```
node_modules/
dist/
.next/
.vercel/
*.dmg
.DS_Store
```

**Step 7: Install dependencies and verify**

Run: `npm install` (from root)
Expected: All workspaces installed successfully.

**Step 8: Commit**

```bash
git add -A
git commit -m "feat: scaffold project with cli and web workspaces"
```

---

### Task 2: Core Promo Logic (TypeScript, TDD)

This is the shared brain. Both CLI and web import from this module.

**Files:**
- Create: `apps/cli/src/promo.ts`
- Create: `apps/cli/src/promo.test.ts`

**Step 1: Write failing tests for promo logic**

```typescript
// apps/cli/src/promo.test.ts
import { describe, it, expect } from 'vitest';
import {
  type PromoConfig,
  type PromoStatus,
  getActivePromo,
  getPromoStatus,
} from './promo.js';

const TEST_CONFIG: PromoConfig = {
  version: 1,
  promos: [
    {
      id: 'test-promo',
      name: 'Test Promo',
      description: 'Test',
      multiplier: 2,
      startDate: '2026-03-13T00:00:00-07:00',
      endDate: '2026-03-28T23:59:00-07:00',
      peakHours: {
        timezone: 'America/Los_Angeles',
        weekdaysOnly: true,
        start: '05:00',
        end: '11:00',
      },
      eligiblePlans: ['free', 'pro', 'max', 'team'],
      infoUrl: 'https://example.com',
    },
  ],
};

describe('getActivePromo', () => {
  it('returns promo when current date is within range', () => {
    const now = new Date('2026-03-18T10:00:00-07:00');
    const promo = getActivePromo(TEST_CONFIG, now);
    expect(promo).not.toBeNull();
    expect(promo!.id).toBe('test-promo');
  });

  it('returns null when no promo is active', () => {
    const now = new Date('2026-04-01T10:00:00-07:00');
    const promo = getActivePromo(TEST_CONFIG, now);
    expect(promo).toBeNull();
  });

  it('returns null before promo starts', () => {
    const now = new Date('2026-03-12T10:00:00-07:00');
    const promo = getActivePromo(TEST_CONFIG, now);
    expect(promo).toBeNull();
  });
});

describe('getPromoStatus', () => {
  it('returns bonus active during off-peak weekday', () => {
    // 3 PM PT on a Wednesday = off-peak
    const now = new Date('2026-03-18T15:00:00-07:00');
    const status = getPromoStatus(TEST_CONFIG, now);
    expect(status.bonusActive).toBe(true);
    expect(status.multiplier).toBe(2);
    expect(status.minutesRemaining).toBeGreaterThan(0);
  });

  it('returns bonus inactive during peak weekday', () => {
    // 8 AM PT on a Wednesday = peak
    const now = new Date('2026-03-18T08:00:00-07:00');
    const status = getPromoStatus(TEST_CONFIG, now);
    expect(status.bonusActive).toBe(false);
    expect(status.multiplier).toBe(1);
    expect(status.minutesUntilBonus).toBeGreaterThan(0);
  });

  it('returns bonus active on weekends (no peak hours)', () => {
    // Saturday 9 AM PT = would be peak on weekday, but weekends have no peak
    const now = new Date('2026-03-14T09:00:00-07:00');
    const status = getPromoStatus(TEST_CONFIG, now);
    expect(status.bonusActive).toBe(true);
  });

  it('returns bonus active just after peak ends', () => {
    // 11:01 AM PT Wednesday = just after peak
    const now = new Date('2026-03-18T11:01:00-07:00');
    const status = getPromoStatus(TEST_CONFIG, now);
    expect(status.bonusActive).toBe(true);
  });

  it('returns bonus inactive at peak start', () => {
    // 5:00 AM PT Wednesday = peak starts
    const now = new Date('2026-03-18T05:00:00-07:00');
    const status = getPromoStatus(TEST_CONFIG, now);
    expect(status.bonusActive).toBe(false);
  });

  it('returns no promo status when outside promo dates', () => {
    const now = new Date('2026-04-01T15:00:00-07:00');
    const status = getPromoStatus(TEST_CONFIG, now);
    expect(status.hasActivePromo).toBe(false);
    expect(status.bonusActive).toBe(false);
  });

  it('calculates NZ timezone correctly - working hours are bonus', () => {
    // 10 AM NZDT Wed Mar 18 = Tue Mar 17 1 PM PT = off-peak
    // NZDT = UTC+13, PT = UTC-7, so diff is 20 hours
    // 10 AM NZDT = 10:00 - 13:00 UTC offset = previous day 9 PM UTC
    // 9 PM UTC = 2 PM PT = off-peak (peak is 5-11 AM PT)
    const nzWorkingHour = new Date('2026-03-17T21:00:00Z'); // 10 AM NZDT Wed
    const status = getPromoStatus(TEST_CONFIG, nzWorkingHour);
    expect(status.bonusActive).toBe(true);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd apps/cli && npx vitest run src/promo.test.ts`
Expected: FAIL — module './promo.js' not found

**Step 3: Implement the promo logic**

```typescript
// apps/cli/src/promo.ts

export interface PeakHours {
  timezone: string;
  weekdaysOnly: boolean;
  start: string; // "HH:MM"
  end: string;   // "HH:MM"
}

export interface Promo {
  id: string;
  name: string;
  description: string;
  multiplier: number;
  startDate: string;
  endDate: string;
  peakHours: PeakHours;
  eligiblePlans: string[];
  infoUrl: string;
}

export interface PromoConfig {
  version: number;
  promos: Promo[];
}

export interface PromoStatus {
  hasActivePromo: boolean;
  promo: Promo | null;
  bonusActive: boolean;
  multiplier: number;
  /** Minutes remaining in current bonus window (only when bonusActive) */
  minutesRemaining: number;
  /** Minutes until next bonus window starts (only when !bonusActive) */
  minutesUntilBonus: number;
  /** When the current window (bonus or peak) ends, in local time */
  windowEndLocal: Date | null;
  /** When the next bonus window starts, in local time */
  nextBonusStartLocal: Date | null;
  /** Promo end date */
  promoEndDate: Date | null;
  /** Progress through current bonus window as 0-1 */
  bonusProgress: number;
}

export function getActivePromo(config: PromoConfig, now: Date = new Date()): Promo | null {
  for (const promo of config.promos) {
    const start = new Date(promo.startDate);
    const end = new Date(promo.endDate);
    if (now >= start && now <= end) {
      return promo;
    }
  }
  return null;
}

/**
 * Get the current hour and minute in a specific timezone.
 */
function getTimeInTimezone(date: Date, timezone: string): { hours: number; minutes: number; dayOfWeek: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    minute: 'numeric',
    weekday: 'short',
    hour12: false,
  }).formatToParts(date);

  let hours = 0;
  let minutes = 0;
  let weekday = '';

  for (const part of parts) {
    if (part.type === 'hour') hours = parseInt(part.value, 10);
    if (part.type === 'minute') minutes = parseInt(part.value, 10);
    if (part.type === 'weekday') weekday = part.value;
  }

  // Handle midnight: Intl may return 24 as 0
  const dayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const dayOfWeek = dayMap[weekday] ?? 0;

  return { hours, minutes, dayOfWeek };
}

function parseTime(timeStr: string): { hours: number; minutes: number } {
  const [h, m] = timeStr.split(':').map(Number);
  return { hours: h, minutes: m };
}

function timeToMinutes(hours: number, minutes: number): number {
  return hours * 60 + minutes;
}

export function getPromoStatus(config: PromoConfig, now: Date = new Date()): PromoStatus {
  const noPromo: PromoStatus = {
    hasActivePromo: false,
    promo: null,
    bonusActive: false,
    multiplier: 1,
    minutesRemaining: 0,
    minutesUntilBonus: 0,
    windowEndLocal: null,
    nextBonusStartLocal: null,
    promoEndDate: null,
    bonusProgress: 0,
  };

  const promo = getActivePromo(config, now);
  if (!promo) return noPromo;

  const tz = promo.peakHours.timezone;
  const { hours, minutes, dayOfWeek } = getTimeInTimezone(now, tz);
  const currentMinutes = timeToMinutes(hours, minutes);

  const peakStart = parseTime(promo.peakHours.start);
  const peakEnd = parseTime(promo.peakHours.end);
  const peakStartMinutes = timeToMinutes(peakStart.hours, peakStart.minutes);
  const peakEndMinutes = timeToMinutes(peakEnd.hours, peakEnd.minutes);

  const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
  const isInPeakTimeRange = currentMinutes >= peakStartMinutes && currentMinutes < peakEndMinutes;
  const isDuringPeak = promo.peakHours.weekdaysOnly ? (isWeekday && isInPeakTimeRange) : isInPeakTimeRange;

  const bonusActive = !isDuringPeak;

  let minutesRemaining = 0;
  let minutesUntilBonus = 0;
  let bonusProgress = 0;

  if (bonusActive) {
    if (isWeekday && promo.peakHours.weekdaysOnly) {
      // Bonus active on weekday: figure out when peak starts
      if (currentMinutes < peakStartMinutes) {
        // Before peak: bonus runs from midnight (or previous peak end) to peak start
        minutesRemaining = peakStartMinutes - currentMinutes;
        // Progress: time since peak ended yesterday (or midnight) to peak start
        const bonusWindowLength = peakStartMinutes + (24 * 60 - peakEndMinutes);
        const elapsed = 24 * 60 - peakEndMinutes + currentMinutes;
        bonusProgress = Math.min(1, elapsed / bonusWindowLength);
      } else {
        // After peak: bonus runs from peak end to midnight then to next peak start
        const minutesToMidnight = 24 * 60 - currentMinutes;
        minutesRemaining = minutesToMidnight + peakStartMinutes;
        // But if tomorrow is weekend, add full day(s)
        const tomorrow = (dayOfWeek + 1) % 7;
        if (tomorrow === 6) minutesRemaining += 2 * 24 * 60; // Sat+Sun
        else if (tomorrow === 0) minutesRemaining += 24 * 60; // Sun only
        const bonusWindowLength = 24 * 60 - peakEndMinutes + peakStartMinutes;
        const elapsed = currentMinutes - peakEndMinutes;
        bonusProgress = Math.min(1, elapsed / bonusWindowLength);
      }
    } else {
      // Weekend or non-weekday-only: bonus all day
      // Minutes remaining until next peak (Monday morning)
      const daysUntilMonday = dayOfWeek === 0 ? 1 : dayOfWeek === 6 ? 2 : 0;
      minutesRemaining = daysUntilMonday * 24 * 60 + (24 * 60 - currentMinutes) + peakStartMinutes;
      // For weekends, show progress as % through the weekend
      if (dayOfWeek === 6) {
        const totalWeekendMinutes = 2 * 24 * 60;
        const elapsed = currentMinutes;
        bonusProgress = Math.min(1, elapsed / totalWeekendMinutes);
      } else if (dayOfWeek === 0) {
        const totalWeekendMinutes = 2 * 24 * 60;
        const elapsed = 24 * 60 + currentMinutes;
        bonusProgress = Math.min(1, elapsed / totalWeekendMinutes);
      }
    }
  } else {
    // During peak
    minutesUntilBonus = peakEndMinutes - currentMinutes;
  }

  // Calculate local window end and next bonus start
  const windowEndLocal = new Date(now.getTime() + (bonusActive ? minutesRemaining : minutesUntilBonus) * 60 * 1000);
  const nextBonusStartLocal = bonusActive ? null : new Date(now.getTime() + minutesUntilBonus * 60 * 1000);

  return {
    hasActivePromo: true,
    promo,
    bonusActive,
    multiplier: bonusActive ? promo.multiplier : 1,
    minutesRemaining,
    minutesUntilBonus,
    windowEndLocal,
    nextBonusStartLocal,
    promoEndDate: new Date(promo.endDate),
    bonusProgress,
  };
}

/**
 * Format minutes into "Xh Ym" string.
 */
export function formatDuration(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const mins = Math.round(totalMinutes % 60);
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

/**
 * Format a Date to local time string like "2:00 PM NZDT".
 */
export function formatLocalTime(date: Date): string {
  return date.toLocaleTimeString('en-NZ', {
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  });
}
```

**Step 4: Run tests to verify they pass**

Run: `cd apps/cli && npx vitest run src/promo.test.ts`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add apps/cli/src/promo.ts apps/cli/src/promo.test.ts
git commit -m "feat: core promo status logic with timezone handling"
```

---

### Task 3: Promo Config Fetching

**Files:**
- Create: `apps/cli/src/config.ts`
- Create: `apps/cli/src/config.test.ts`

**Step 1: Write failing tests**

```typescript
// apps/cli/src/config.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadConfig, FALLBACK_CONFIG } from './config.js';
import type { PromoConfig } from './promo.js';

describe('loadConfig', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns fetched config on success', async () => {
    const mockConfig: PromoConfig = {
      version: 1,
      promos: [{
        id: 'test',
        name: 'Test',
        description: 'Test',
        multiplier: 2,
        startDate: '2026-03-13T00:00:00-07:00',
        endDate: '2026-03-28T23:59:00-07:00',
        peakHours: { timezone: 'America/Los_Angeles', weekdaysOnly: true, start: '05:00', end: '11:00' },
        eligiblePlans: ['pro'],
        infoUrl: 'https://example.com',
      }],
    };

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockConfig),
    }));

    const config = await loadConfig();
    expect(config.version).toBe(1);
    expect(config.promos).toHaveLength(1);
  });

  it('returns fallback config when fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

    const config = await loadConfig();
    expect(config).toEqual(FALLBACK_CONFIG);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd apps/cli && npx vitest run src/config.test.ts`
Expected: FAIL

**Step 3: Implement config fetching**

```typescript
// apps/cli/src/config.ts
import type { PromoConfig } from './promo.js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const CONFIG_URL = 'https://claudeclock.com/api/promo';

// Bundled fallback — works offline
export const FALLBACK_CONFIG: PromoConfig = JSON.parse(
  readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), '../../shared/promo-config.json'), 'utf-8')
);

export async function loadConfig(): Promise<PromoConfig> {
  try {
    const response = await fetch(CONFIG_URL, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json() as PromoConfig;
  } catch {
    return FALLBACK_CONFIG;
  }
}
```

Note: For the test, the fallback path may need adjustment. The test mocks `fetch`, so the fallback path is only hit when fetch throws. In production, the `FALLBACK_CONFIG` read happens at import time — we may need to handle this differently if the shared path doesn't resolve. If tests fail due to the `readFileSync`, refactor to inline the fallback or make path resolution more robust.

**Step 4: Run tests and fix**

Run: `cd apps/cli && npx vitest run src/config.test.ts`
Expected: PASS (adjust file path resolution if needed)

**Step 5: Commit**

```bash
git add apps/cli/src/config.ts apps/cli/src/config.test.ts
git commit -m "feat: promo config fetching with offline fallback"
```

---

### Task 4: CLI Quick-Check Mode

**Files:**
- Create: `apps/cli/src/index.tsx`
- Create: `apps/cli/src/components/QuickStatus.tsx`

**Step 1: Create the QuickStatus ink component**

```tsx
// apps/cli/src/components/QuickStatus.tsx
import React from 'react';
import { Text, Box } from 'ink';
import type { PromoStatus } from '../promo.js';
import { formatDuration, formatLocalTime } from '../promo.js';

interface Props {
  status: PromoStatus;
}

export function QuickStatus({ status }: Props) {
  if (!status.hasActivePromo) {
    return (
      <Box flexDirection="column">
        <Text>⏸ No active Claude promotion</Text>
        <Text dimColor>  Check claudeclock.com for updates</Text>
      </Box>
    );
  }

  if (status.bonusActive) {
    return (
      <Box flexDirection="column">
        <Text bold color="green">
          ⚡ BONUS ACTIVE — {status.multiplier}x usage for {formatDuration(status.minutesRemaining)}
        </Text>
        {status.windowEndLocal && (
          <Text dimColor>  Bonus ends: {formatLocalTime(status.windowEndLocal)}</Text>
        )}
        {status.promoEndDate && (
          <Text dimColor>
            {'  '}Promo ends: {status.promoEndDate.toLocaleDateString('en-NZ', { month: 'short', day: 'numeric', year: 'numeric' })}
          </Text>
        )}
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Text color="yellow">
        💤 Standard rate — bonus resumes in {formatDuration(status.minutesUntilBonus)}
      </Text>
      {status.nextBonusStartLocal && (
        <Text dimColor>  Bonus starts: {formatLocalTime(status.nextBonusStartLocal)}</Text>
      )}
    </Box>
  );
}
```

**Step 2: Create the CLI entry point**

```tsx
#!/usr/bin/env node
// apps/cli/src/index.tsx
import React from 'react';
import { render } from 'ink';
import meow from 'meow';
import { loadConfig } from './config.js';
import { getPromoStatus } from './promo.js';
import { QuickStatus } from './components/QuickStatus.js';
import { WatchDashboard } from './components/WatchDashboard.js';

const cli = meow(`
  Usage
    $ claudeclock              Quick status check
    $ claudeclock --watch      Live updating dashboard
    $ claudeclock --json       Machine-readable output

  Options
    --watch, -w    Live updating dashboard
    --json         Output as JSON
    --plan <plan>  Set your Claude plan (free/pro/max/team)
    --notify       System notification on bonus start/end
`, {
  importMeta: import.meta,
  flags: {
    watch: { type: 'boolean', shortFlag: 'w', default: false },
    json: { type: 'boolean', default: false },
    plan: { type: 'string' },
    notify: { type: 'boolean', default: false },
  },
});

async function main() {
  const config = await loadConfig();
  const status = getPromoStatus(config);

  if (cli.flags.json) {
    console.log(JSON.stringify(status, null, 2));
    process.exit(0);
  }

  if (cli.flags.watch) {
    render(<WatchDashboard config={config} />);
    return;
  }

  // Quick check mode — render and exit
  const { unmount, waitUntilExit } = render(<QuickStatus status={status} />);
  setTimeout(() => {
    unmount();
  }, 100);
  await waitUntilExit();
}

main().catch(console.error);
```

**Step 3: Test it manually**

Run: `cd apps/cli && npx tsx src/index.tsx`
Expected: Shows current bonus status with colored output

Run: `cd apps/cli && npx tsx src/index.tsx --json`
Expected: JSON output of promo status

**Step 4: Commit**

```bash
git add apps/cli/src/index.tsx apps/cli/src/components/QuickStatus.tsx
git commit -m "feat: CLI quick-check mode with ink rendering"
```

---

### Task 5: CLI Watch Mode (Live TUI Dashboard)

**Files:**
- Create: `apps/cli/src/components/WatchDashboard.tsx`
- Create: `apps/cli/src/components/ProgressBar.tsx`

**Step 1: Create ProgressBar component**

```tsx
// apps/cli/src/components/ProgressBar.tsx
import React from 'react';
import { Text } from 'ink';

interface Props {
  progress: number; // 0 to 1
  width?: number;
  label?: string;
}

export function ProgressBar({ progress, width = 20, label }: Props) {
  const filled = Math.round(progress * width);
  const empty = width - filled;
  const percent = Math.round(progress * 100);

  return (
    <Text>
      <Text color="green">{'▓'.repeat(filled)}</Text>
      <Text dimColor>{'░'.repeat(empty)}</Text>
      <Text> {percent}%</Text>
      {label && <Text dimColor> {label}</Text>}
    </Text>
  );
}
```

**Step 2: Create WatchDashboard component**

```tsx
// apps/cli/src/components/WatchDashboard.tsx
import React, { useState, useEffect } from 'react';
import { Text, Box, useInput, useApp } from 'ink';
import type { PromoConfig, PromoStatus } from '../promo.js';
import { getPromoStatus, formatDuration, formatLocalTime } from '../promo.js';
import { ProgressBar } from './ProgressBar.js';

interface Props {
  config: PromoConfig;
}

export function WatchDashboard({ config }: Props) {
  const { exit } = useApp();
  const [status, setStatus] = useState<PromoStatus>(getPromoStatus(config));

  useEffect(() => {
    const interval = setInterval(() => {
      setStatus(getPromoStatus(config));
    }, 1000);
    return () => clearInterval(interval);
  }, [config]);

  useInput((input) => {
    if (input === 'q') exit();
  });

  const border = '═'.repeat(38);
  const promoEndStr = status.promoEndDate
    ? status.promoEndDate.toLocaleDateString('en-NZ', { month: 'short', day: 'numeric', year: 'numeric' })
    : '';

  if (!status.hasActivePromo) {
    return (
      <Box flexDirection="column" borderStyle="double" padding={1}>
        <Text bold>        ⏸  CLAUDE CLOCK  ⏸</Text>
        <Text> </Text>
        <Text dimColor>  No active promotion</Text>
        <Text dimColor>  Check claudeclock.com for updates</Text>
        <Text> </Text>
        <Text dimColor>  q to quit · claudeclock.com</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" borderStyle="double" padding={1}>
      <Text bold>        ⚡ CLAUDE CLOCK ⚡</Text>
      <Text> </Text>
      {status.bonusActive ? (
        <>
          <Text bold color="green">  STATUS:  {status.multiplier}X BONUS ACTIVE</Text>
          <Box marginLeft={2}>
            <ProgressBar progress={status.bonusProgress} />
          </Box>
          <Text> </Text>
          <Text>  Bonus ends:   {status.windowEndLocal ? formatLocalTime(status.windowEndLocal) : '—'}</Text>
          <Text>  Time left:    {formatDuration(status.minutesRemaining)}</Text>
        </>
      ) : (
        <>
          <Text bold color="yellow">  STATUS:  STANDARD (1X)</Text>
          <Text> </Text>
          <Text>  Bonus in:     {formatDuration(status.minutesUntilBonus)}</Text>
          <Text>  Resumes at:   {status.nextBonusStartLocal ? formatLocalTime(status.nextBonusStartLocal) : '—'}</Text>
        </>
      )}
      <Text> </Text>
      <Text>  Promo:   {status.promo?.name ?? '—'}</Text>
      <Text>  Ends:    {promoEndStr}</Text>
      <Text> </Text>
      <Text dimColor>  q to quit · claudeclock.com</Text>
    </Box>
  );
}
```

**Step 3: Test it manually**

Run: `cd apps/cli && npx tsx src/index.tsx --watch`
Expected: Full-screen TUI with live-updating countdown. Press `q` to quit.

**Step 4: Commit**

```bash
git add apps/cli/src/components/WatchDashboard.tsx apps/cli/src/components/ProgressBar.tsx
git commit -m "feat: live watch mode TUI dashboard"
```

---

### Task 6: CLI --json and --notify Flags

**Files:**
- Modify: `apps/cli/src/index.tsx` (already handles --json)
- Create: `apps/cli/src/notify.ts`

**Step 1: Implement notification helper**

```typescript
// apps/cli/src/notify.ts
import notifier from 'node-notifier';

export function sendNotification(title: string, message: string) {
  notifier.notify({
    title,
    message,
    sound: true,
  });
}
```

**Step 2: Add notification logic to WatchDashboard**

Modify `WatchDashboard.tsx` to accept a `notify` prop. When enabled, fire a system notification when bonus status changes (active → inactive or vice versa). Track previous state with `useRef`.

```tsx
// Add to WatchDashboard.tsx
import { useRef } from 'react';
import { sendNotification } from '../notify.js';

// Inside component:
const prevBonusActive = useRef(status.bonusActive);

useEffect(() => {
  if (notify && prevBonusActive.current !== status.bonusActive) {
    if (status.bonusActive) {
      sendNotification('⚡ Claude Clock', 'Bonus window is now ACTIVE! 2x usage enabled.');
    } else {
      sendNotification('💤 Claude Clock', 'Bonus window ended. Standard usage rates.');
    }
  }
  prevBonusActive.current = status.bonusActive;
}, [status.bonusActive, notify]);
```

**Step 3: Test --json manually**

Run: `cd apps/cli && npx tsx src/index.tsx --json`
Expected: Clean JSON output with all PromoStatus fields

**Step 4: Test --notify manually**

Run: `cd apps/cli && npx tsx src/index.tsx --watch --notify`
Expected: Dashboard shows, notification will fire on state change (test by waiting or adjusting system clock)

**Step 5: Commit**

```bash
git add apps/cli/src/notify.ts apps/cli/src/components/WatchDashboard.tsx apps/cli/src/index.tsx
git commit -m "feat: add --json output and --notify system notifications"
```

---

### Task 7: CLI Build & npm Packaging

**Files:**
- Modify: `apps/cli/package.json` (verify bin, files, type fields)
- Modify: `apps/cli/tsconfig.json` (verify output settings)

**Step 1: Ensure package.json is correct for publishing**

Verify these fields in `apps/cli/package.json`:
```json
{
  "name": "claudeclock",
  "version": "1.0.0",
  "type": "module",
  "bin": { "claudeclock": "./dist/index.js" },
  "files": ["dist"],
  "engines": { "node": ">=18" }
}
```

**Step 2: Build and test**

Run: `cd apps/cli && npm run build`
Expected: TypeScript compiles to `dist/` without errors

Run: `cd apps/cli && node dist/index.js`
Expected: Quick status check output

Run: `cd apps/cli && node dist/index.js --json`
Expected: JSON output

**Step 3: Test global install locally**

Run: `cd apps/cli && npm link`
Run: `claudeclock`
Expected: Works as a global command

Run: `claudeclock --watch`
Expected: TUI dashboard

**Step 4: Commit**

```bash
git add apps/cli/package.json apps/cli/tsconfig.json
git commit -m "feat: CLI build and npm packaging configuration"
```

---

### Task 8: Next.js API Endpoint

**Files:**
- Create: `apps/web/app/api/promo/route.ts`
- Ensure `shared/promo-config.json` is readable from here

**Step 1: Create the API route**

```typescript
// apps/web/app/api/promo/route.ts
import { NextResponse } from 'next/server';
import config from '../../../../shared/promo-config.json';

export async function GET() {
  return NextResponse.json(config, {
    headers: {
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
```

**Step 2: Test it**

Run: `cd apps/web && npm run dev`
Then: `curl http://localhost:3000/api/promo`
Expected: Returns the promo config JSON

**Step 3: Commit**

```bash
git add apps/web/app/api/promo/route.ts
git commit -m "feat: API endpoint serving promo config"
```

---

### Task 9: Web Landing Page with Timezone Detection

**Files:**
- Modify: `apps/web/app/page.tsx`
- Create: `apps/web/app/components/HeroMessage.tsx`
- Modify: `apps/web/app/layout.tsx`
- Modify: `apps/web/app/globals.css`

**Step 1: Create the HeroMessage client component with timezone detection**

```tsx
// apps/web/app/components/HeroMessage.tsx
'use client';

import { useState, useEffect } from 'react';

// Map timezone regions to friendly messages
function getTimezoneMessage(tz: string): string {
  // APAC timezones where working day = bonus window
  const apacZones: Record<string, string> = {
    'Pacific/Auckland': "You're in New Zealand",
    'Pacific/Chatham': "You're in Chatham Islands",
    'Australia/Sydney': "You're in Sydney",
    'Australia/Melbourne': "You're in Melbourne",
    'Australia/Brisbane': "You're in Brisbane",
    'Australia/Perth': "You're in Perth",
    'Australia/Adelaide': "You're in Adelaide",
    'Australia/Hobart': "You're in Hobart",
    'Asia/Tokyo': "You're in Tokyo",
    'Asia/Seoul': "You're in Seoul",
    'Asia/Singapore': "You're in Singapore",
    'Asia/Hong_Kong': "You're in Hong Kong",
    'Asia/Shanghai': "You're in China",
    'Asia/Kolkata': "You're in India",
    'Asia/Bangkok': "You're in Bangkok",
    'Asia/Jakarta': "You're in Jakarta",
  };

  for (const [zone, label] of Object.entries(apacZones)) {
    if (tz === zone) return `${label} — your working day IS the bonus window.`;
  }

  // Check if timezone offset puts them in a favorable position
  const offset = new Date().getTimezoneOffset(); // minutes behind UTC
  if (offset <= -480) { // UTC+8 or more (APAC)
    return `You're in the APAC region — most of your working day falls in the bonus window.`;
  }

  return `Check your local bonus window times below.`;
}

export function HeroMessage() {
  const [message, setMessage] = useState('');
  const [tz, setTz] = useState('');

  useEffect(() => {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setTz(timezone);
    setMessage(getTimezoneMessage(timezone));
  }, []);

  if (!message) return null;

  return (
    <div>
      <p className="text-xl md:text-2xl text-gray-300 mt-4 max-w-2xl mx-auto">
        {message}
      </p>
      {tz && (
        <p className="text-sm text-gray-500 mt-2">
          Detected timezone: {tz}
        </p>
      )}
    </div>
  );
}
```

**Step 2: Build the landing page**

```tsx
// apps/web/app/page.tsx
import Link from 'next/link';
import { HeroMessage } from './components/HeroMessage';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-4xl mx-auto px-6 py-20 text-center">
        {/* Hero */}
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
          <span className="text-yellow-400">⚡</span> Claude Clock
        </h1>
        <HeroMessage />

        {/* What it does */}
        <div className="mt-16 text-left max-w-2xl mx-auto">
          <h2 className="text-2xl font-semibold mb-4">What is this?</h2>
          <p className="text-gray-400 leading-relaxed">
            Anthropic is running a limited promotion (March 13–28, 2026) giving
            2x usage limits outside US peak hours. For developers in NZ, Australia,
            and APAC, this means your entire working day gets double the tokens.
          </p>
          <p className="text-gray-400 leading-relaxed mt-3">
            Claude Clock shows you when the bonus window is active, how long it
            lasts, and when it ends — right in your menu bar or terminal.
          </p>
        </div>

        {/* Downloads */}
        <div className="mt-16 grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <h3 className="text-lg font-semibold mb-2">macOS Menu Bar</h3>
            <p className="text-gray-400 text-sm mb-4">
              Always-visible status in your menu bar. Click to see details.
            </p>
            <a
              href="/downloads/ClaudeClock.dmg"
              className="inline-block bg-yellow-500 text-gray-900 font-semibold px-6 py-2 rounded-lg hover:bg-yellow-400 transition"
            >
              Download .dmg
            </a>
          </div>
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <h3 className="text-lg font-semibold mb-2">Terminal CLI</h3>
            <p className="text-gray-400 text-sm mb-4">
              Quick status checks or a live dashboard in your terminal.
            </p>
            <code className="block bg-gray-800 rounded-lg p-3 text-sm text-green-400">
              npm install -g claudeclock
            </code>
          </div>
        </div>

        {/* Live clock link */}
        <div className="mt-12">
          <Link
            href="/clock"
            className="text-yellow-400 hover:text-yellow-300 underline text-lg"
          >
            View live web clock →
          </Link>
        </div>

        {/* Footer */}
        <footer className="mt-20 text-gray-600 text-sm">
          <a
            href="https://support.claude.com/en/articles/14063676-claude-march-2026-usage-promotion"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-400"
          >
            Anthropic promotion details →
          </a>
        </footer>
      </div>
    </main>
  );
}
```

**Step 3: Update layout.tsx**

Set dark background, proper metadata:

```tsx
// apps/web/app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Claude Clock — Know When Your Bonus Window Is Active',
  description: 'See when Anthropic\'s 2x token bonus is active in your timezone. Built for NZ/AU/APAC Claude users.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-gray-950 antialiased">{children}</body>
    </html>
  );
}
```

**Step 4: Test it**

Run: `cd apps/web && npm run dev`
Open: `http://localhost:3000`
Expected: Landing page with timezone detection, download buttons, dark theme

**Step 5: Commit**

```bash
git add apps/web/app/
git commit -m "feat: landing page with timezone detection and download links"
```

---

### Task 10: Web Live Clock Page

**Files:**
- Create: `apps/web/app/clock/page.tsx`
- Create: `apps/web/app/components/LiveClock.tsx`

**Step 1: Port core promo logic for the web**

Copy `promo.ts` types and functions into a shared location the web app can import. Simplest approach: create `apps/web/lib/promo.ts` with the same logic (the functions are pure and have no Node dependencies).

Run: `cp apps/cli/src/promo.ts apps/web/lib/promo.ts`

**Step 2: Create LiveClock client component**

```tsx
// apps/web/app/components/LiveClock.tsx
'use client';

import { useState, useEffect } from 'react';
import { getPromoStatus, formatDuration, formatLocalTime, type PromoConfig, type PromoStatus } from '../../lib/promo';

export function LiveClock() {
  const [config, setConfig] = useState<PromoConfig | null>(null);
  const [status, setStatus] = useState<PromoStatus | null>(null);

  useEffect(() => {
    fetch('/api/promo')
      .then(r => r.json())
      .then((cfg: PromoConfig) => {
        setConfig(cfg);
        setStatus(getPromoStatus(cfg));
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!config) return;
    const interval = setInterval(() => {
      setStatus(getPromoStatus(config));
    }, 1000);
    return () => clearInterval(interval);
  }, [config]);

  if (!status) {
    return <div className="text-gray-500">Loading...</div>;
  }

  if (!status.hasActivePromo) {
    return (
      <div className="text-center">
        <div className="text-4xl mb-4">⏸</div>
        <p className="text-xl text-gray-400">No active promotion</p>
      </div>
    );
  }

  const progressPercent = Math.round(status.bonusProgress * 100);
  const promoEnd = status.promoEndDate
    ? status.promoEndDate.toLocaleDateString('en-NZ', { month: 'short', day: 'numeric', year: 'numeric' })
    : '';

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 max-w-md mx-auto text-center">
      <h2 className="text-3xl font-bold mb-6">⚡ Claude Clock</h2>

      {status.bonusActive ? (
        <>
          <div className="text-2xl font-bold text-green-400 mb-4">
            {status.multiplier}X BONUS ACTIVE
          </div>
          {/* Progress bar */}
          <div className="w-full bg-gray-800 rounded-full h-4 mb-4">
            <div
              className="bg-green-500 h-4 rounded-full transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-gray-400">{progressPercent}% through bonus window</p>
          <div className="mt-6 space-y-2 text-left text-gray-300">
            <p>Bonus ends: <span className="text-white font-mono">{status.windowEndLocal ? formatLocalTime(status.windowEndLocal) : '—'}</span></p>
            <p>Time left: <span className="text-white font-mono">{formatDuration(status.minutesRemaining)}</span></p>
          </div>
        </>
      ) : (
        <>
          <div className="text-2xl font-bold text-yellow-400 mb-4">
            STANDARD (1X)
          </div>
          <div className="mt-6 space-y-2 text-left text-gray-300">
            <p>Bonus in: <span className="text-white font-mono">{formatDuration(status.minutesUntilBonus)}</span></p>
            <p>Resumes: <span className="text-white font-mono">{status.nextBonusStartLocal ? formatLocalTime(status.nextBonusStartLocal) : '—'}</span></p>
          </div>
        </>
      )}

      <div className="mt-6 pt-6 border-t border-gray-800 text-gray-500 text-sm">
        <p>{status.promo?.name}</p>
        <p>Promo ends: {promoEnd}</p>
      </div>
    </div>
  );
}
```

**Step 3: Create the clock page**

```tsx
// apps/web/app/clock/page.tsx
import { LiveClock } from '../components/LiveClock';
import Link from 'next/link';

export const metadata = {
  title: 'Live Clock — Claude Clock',
};

export default function ClockPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-6">
      <LiveClock />
      <div className="mt-8">
        <Link href="/" className="text-gray-500 hover:text-gray-300 text-sm">
          ← Back to claudeclock.com
        </Link>
      </div>
    </main>
  );
}
```

**Step 4: Test it**

Run: `cd apps/web && npm run dev`
Open: `http://localhost:3000/clock`
Expected: Live updating clock showing bonus status

**Step 5: Commit**

```bash
git add apps/web/lib/promo.ts apps/web/app/clock/ apps/web/app/components/LiveClock.tsx
git commit -m "feat: live web clock page with real-time bonus status"
```

---

### Task 11: macOS Menu Bar App (Swift/SwiftUI)

**Files:**
- Create: `apps/menubar/ClaudeClock/` (Xcode project)

This task is larger and should be built in Xcode. The plan provides the Swift code structure.

**Step 1: Create Xcode project**

Create a new macOS App project in Xcode:
- Product Name: ClaudeClock
- Interface: SwiftUI
- Language: Swift
- Deployment target: macOS 13.0
- Uncheck "Include Tests" for now (we'll add later if needed)

Set the app to be a menu bar extra (LSUIElement = true in Info.plist, use MenuBarExtra in SwiftUI).

**Step 2: Create PromoConfig model**

```swift
// apps/menubar/ClaudeClock/Models/PromoConfig.swift
import Foundation

struct PromoConfig: Codable {
    let version: Int
    let promos: [Promo]
}

struct Promo: Codable {
    let id: String
    let name: String
    let description: String
    let multiplier: Int
    let startDate: String
    let endDate: String
    let peakHours: PeakHours
    let eligiblePlans: [String]
    let infoUrl: String
}

struct PeakHours: Codable {
    let timezone: String
    let weekdaysOnly: Bool
    let start: String
    let end: String
}
```

**Step 3: Create PromoStatusCalculator**

```swift
// apps/menubar/ClaudeClock/Models/PromoStatus.swift
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
}

class PromoStatusCalculator {
    static func getActivePromo(config: PromoConfig, now: Date = Date()) -> Promo? {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withColonSeparatorInTimeZone]

        for promo in config.promos {
            guard let start = formatter.date(from: promo.startDate),
                  let end = formatter.date(from: promo.endDate) else { continue }
            if now >= start && now <= end {
                return promo
            }
        }
        return nil
    }

    static func getStatus(config: PromoConfig, now: Date = Date()) -> PromoStatus {
        guard let promo = getActivePromo(config: config, now: now) else {
            return PromoStatus(hasActivePromo: false, promo: nil, bonusActive: false,
                             multiplier: 1, minutesRemaining: 0, minutesUntilBonus: 0,
                             windowEnd: nil, nextBonusStart: nil, promoEndDate: nil, bonusProgress: 0)
        }

        guard let tz = TimeZone(identifier: promo.peakHours.timezone) else {
            return PromoStatus(hasActivePromo: true, promo: promo, bonusActive: true,
                             multiplier: promo.multiplier, minutesRemaining: 0, minutesUntilBonus: 0,
                             windowEnd: nil, nextBonusStart: nil, promoEndDate: nil, bonusProgress: 0)
        }

        var calendar = Calendar.current
        calendar.timeZone = tz

        let components = calendar.dateComponents([.hour, .minute, .weekday], from: now)
        let hour = components.hour ?? 0
        let minute = components.minute ?? 0
        let weekday = components.weekday ?? 1 // 1=Sun, 2=Mon ... 7=Sat
        let currentMinutes = hour * 60 + minute

        let peakParts = promo.peakHours.start.split(separator: ":").compactMap { Int($0) }
        let peakEndParts = promo.peakHours.end.split(separator: ":").compactMap { Int($0) }
        let peakStart = peakParts[0] * 60 + peakParts[1]
        let peakEnd = peakEndParts[0] * 60 + peakEndParts[1]

        let isWeekday = weekday >= 2 && weekday <= 6
        let isInPeak = currentMinutes >= peakStart && currentMinutes < peakEnd
        let isDuringPeak = promo.peakHours.weekdaysOnly ? (isWeekday && isInPeak) : isInPeak
        let bonusActive = !isDuringPeak

        var minutesRemaining = 0
        var minutesUntilBonus = 0
        var bonusProgress = 0.0

        if bonusActive {
            if isWeekday && promo.peakHours.weekdaysOnly {
                if currentMinutes < peakStart {
                    minutesRemaining = peakStart - currentMinutes
                } else {
                    minutesRemaining = (24 * 60 - currentMinutes) + peakStart
                }
            } else {
                // Weekend
                let daysUntilMonday: Int
                if weekday == 1 { daysUntilMonday = 1 }
                else if weekday == 7 { daysUntilMonday = 2 }
                else { daysUntilMonday = 0 }
                minutesRemaining = daysUntilMonday * 24 * 60 + (24 * 60 - currentMinutes) + peakStart
            }
        } else {
            minutesUntilBonus = peakEnd - currentMinutes
        }

        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withColonSeparatorInTimeZone]
        let promoEndDate = formatter.date(from: promo.endDate)

        let windowEnd = now.addingTimeInterval(Double(bonusActive ? minutesRemaining : minutesUntilBonus) * 60)
        let nextBonusStart = bonusActive ? nil : now.addingTimeInterval(Double(minutesUntilBonus) * 60)

        return PromoStatus(
            hasActivePromo: true, promo: promo, bonusActive: bonusActive,
            multiplier: bonusActive ? promo.multiplier : 1,
            minutesRemaining: minutesRemaining, minutesUntilBonus: minutesUntilBonus,
            windowEnd: windowEnd, nextBonusStart: nextBonusStart,
            promoEndDate: promoEndDate, bonusProgress: bonusProgress
        )
    }

    static func formatDuration(_ totalMinutes: Int) -> String {
        let hours = totalMinutes / 60
        let mins = totalMinutes % 60
        if hours == 0 { return "\(mins)m" }
        if mins == 0 { return "\(hours)h" }
        return "\(hours)h \(mins)m"
    }
}
```

**Step 4: Create ConfigLoader**

```swift
// apps/menubar/ClaudeClock/Services/ConfigLoader.swift
import Foundation

class ConfigLoader: ObservableObject {
    @Published var config: PromoConfig?
    private let url = URL(string: "https://claudeclock.com/api/promo")!
    private var timer: Timer?

    // Bundled fallback
    private var fallbackConfig: PromoConfig? {
        guard let url = Bundle.main.url(forResource: "promo-config", withExtension: "json"),
              let data = try? Data(contentsOf: url) else { return nil }
        return try? JSONDecoder().decode(PromoConfig.self, from: data)
    }

    func start() {
        loadConfig()
        // Refresh every hour
        timer = Timer.scheduledTimer(withTimeInterval: 3600, repeats: true) { [weak self] _ in
            self?.loadConfig()
        }
    }

    private func loadConfig() {
        URLSession.shared.dataTask(with: url) { [weak self] data, response, error in
            DispatchQueue.main.async {
                if let data = data,
                   let config = try? JSONDecoder().decode(PromoConfig.self, from: data) {
                    self?.config = config
                } else if self?.config == nil {
                    self?.config = self?.fallbackConfig
                }
            }
        }.resume()
    }

    func stop() {
        timer?.invalidate()
    }
}
```

**Step 5: Create the SwiftUI MenuBarExtra app**

```swift
// apps/menubar/ClaudeClock/ClaudeClockApp.swift
import SwiftUI

@main
struct ClaudeClockApp: App {
    @StateObject private var configLoader = ConfigLoader()
    @State private var status: PromoStatus = PromoStatus(
        hasActivePromo: false, promo: nil, bonusActive: false,
        multiplier: 1, minutesRemaining: 0, minutesUntilBonus: 0,
        windowEnd: nil, nextBonusStart: nil, promoEndDate: nil, bonusProgress: 0
    )

    private let timer = Timer.publish(every: 1, on: .main, in: .common).autoconnect()

    var body: some Scene {
        MenuBarExtra {
            MenuBarDropdown(status: status)
        } label: {
            Text(menuBarTitle)
        }
        .onChange(of: configLoader.config) { _ in updateStatus() }
        .onReceive(timer) { _ in updateStatus() }
        .onAppear { configLoader.start() }
    }

    private var menuBarTitle: String {
        if !status.hasActivePromo { return "⏸ —" }
        if status.bonusActive {
            return "⚡\(status.multiplier)X \(PromoStatusCalculator.formatDuration(status.minutesRemaining))"
        }
        return "💤1X \(PromoStatusCalculator.formatDuration(status.minutesUntilBonus))→⚡"
    }

    private func updateStatus() {
        guard let config = configLoader.config else { return }
        status = PromoStatusCalculator.getStatus(config: config)
    }
}
```

**Step 6: Create the dropdown view**

```swift
// apps/menubar/ClaudeClock/Views/MenuBarDropdown.swift
import SwiftUI

struct MenuBarDropdown: View {
    let status: PromoStatus

    private let timeFormatter: DateFormatter = {
        let f = DateFormatter()
        f.dateStyle = .none
        f.timeStyle = .short
        f.timeZone = .current
        return f
    }()

    private let dateFormatter: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "MMM d, yyyy"
        return f
    }()

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            if !status.hasActivePromo {
                Text("No active promotion")
                    .foregroundColor(.secondary)
            } else if status.bonusActive {
                Label("Double Tokens: ACTIVE", systemImage: "bolt.fill")
                    .font(.headline)
                    .foregroundColor(.green)

                Divider()

                if let end = status.windowEnd {
                    Text("Bonus ends: \(timeFormatter.string(from: end))")
                }
                Text("Time left: \(PromoStatusCalculator.formatDuration(status.minutesRemaining))")

                ProgressView(value: status.bonusProgress)
                    .tint(.green)
            } else {
                Label("Standard Rate", systemImage: "moon.fill")
                    .font(.headline)
                    .foregroundColor(.yellow)

                Divider()

                Text("Bonus in: \(PromoStatusCalculator.formatDuration(status.minutesUntilBonus))")
                if let next = status.nextBonusStart {
                    Text("Resumes: \(timeFormatter.string(from: next))")
                }
            }

            if let endDate = status.promoEndDate {
                Divider()
                Text("Promo ends: \(dateFormatter.string(from: endDate))")
                    .foregroundColor(.secondary)
                    .font(.caption)
            }

            Divider()

            Link("claudeclock.com", destination: URL(string: "https://claudeclock.com")!)
                .font(.caption)

            Button("Quit") {
                NSApplication.shared.terminate(nil)
            }
        }
        .padding()
        .frame(width: 250)
    }
}
```

**Step 7: Bundle the fallback config**

Copy `shared/promo-config.json` into the Xcode project as a bundle resource.

**Step 8: Build and test**

Build in Xcode (Cmd+B). Run (Cmd+R).
Expected: Menu bar shows `⚡2X Xh Ym` with correct countdown. Click expands dropdown.

**Step 9: Commit**

```bash
git add apps/menubar/
git commit -m "feat: macOS menu bar app with live bonus status"
```

---

### Task 12: Vercel Deployment

**Files:**
- Create: `apps/web/vercel.json` (if needed)
- Modify: DNS for claudeclock.com

**Step 1: Deploy to Vercel**

Run: `cd apps/web && npx vercel`
Follow prompts to link to Vercel project.

**Step 2: Configure custom domain**

In Vercel dashboard, add `claudeclock.com` as custom domain.
Update DNS records as directed by Vercel.

**Step 3: Verify deployment**

Open: `https://claudeclock.com`
Expected: Landing page loads with timezone detection

Open: `https://claudeclock.com/api/promo`
Expected: Returns promo JSON

Open: `https://claudeclock.com/clock`
Expected: Live clock works

**Step 4: Commit any config changes**

```bash
git add apps/web/vercel.json
git commit -m "feat: Vercel deployment configuration"
```

---

### Task 13: npm Publish

**Step 1: Ensure CLI builds cleanly**

Run: `cd apps/cli && npm run build`
Expected: Clean build with no errors

**Step 2: Test the package**

Run: `cd apps/cli && npm pack --dry-run`
Expected: Shows files that would be included. Verify only `dist/` and package.json.

**Step 3: Publish to npm**

Run: `cd apps/cli && npm publish`
Expected: Published as `claudeclock` on npm

**Step 4: Verify install**

Run: `npm install -g claudeclock`
Run: `claudeclock`
Expected: Shows bonus status

---

### Task 14: DMG Build for Menu Bar App

**Step 1: Archive the app in Xcode**

Product → Archive in Xcode.
Export as "Developer ID" signed app (or unsigned for initial testing).

**Step 2: Create DMG**

Run: `hdiutil create -volname "Claude Clock" -srcfolder "path/to/ClaudeClock.app" -ov -format UDZO apps/web/public/downloads/ClaudeClock.dmg`

**Step 3: Deploy updated website**

Run: `cd apps/web && npx vercel --prod`
Expected: DMG available at claudeclock.com/downloads/ClaudeClock.dmg

**Step 4: Commit**

```bash
git add apps/web/public/downloads/
git commit -m "feat: add macOS menu bar app DMG for download"
```
