// Core promo status logic adapted for web.
// Copied from apps/cli/src/promo.ts — browser-compatible (no Node.js imports).

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
  startDate: string; // ISO 8601
  endDate: string;   // ISO 8601
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
  minutesRemaining: number;
  minutesUntilBonus: number;
  windowEndLocal: Date | null;
  nextBonusStartLocal: Date | null;
  promoEndDate: Date | null;
  bonusProgress: number;
}

/**
 * Find the first promo whose date range contains `now`.
 */
export function getActivePromo(config: PromoConfig, now?: Date): Promo | null {
  const ts = (now ?? new Date()).getTime();
  for (const promo of config.promos) {
    const start = new Date(promo.startDate).getTime();
    const end = new Date(promo.endDate).getTime();
    if (ts >= start && ts <= end) {
      return promo;
    }
  }
  return null;
}

/**
 * Parse "HH:MM" into { hours, minutes }.
 */
function parseTime(time: string): { hours: number; minutes: number } {
  const [h, m] = time.split(':').map(Number);
  return { hours: h, minutes: m };
}

/**
 * Get the current time components in a specific timezone using Intl.
 */
function getTimeInTimezone(date: Date, timezone: string): {
  year: number;
  month: number;
  day: number;
  hours: number;
  minutes: number;
  dayOfWeek: number;
} {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    weekday: 'short',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const get = (type: string) => parts.find(p => p.type === type)?.value ?? '';

  const year = parseInt(get('year'), 10);
  const month = parseInt(get('month'), 10);
  const day = parseInt(get('day'), 10);
  let hours = parseInt(get('hour'), 10);
  if (hours === 24) hours = 0;
  const minutes = parseInt(get('minute'), 10);

  const weekdayStr = get('weekday');
  const dayMap: Record<string, number> = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
  };
  const dayOfWeek = dayMap[weekdayStr] ?? 0;

  return { year, month, day, hours, minutes, dayOfWeek };
}

/**
 * Convert hours and minutes in a given timezone on a given date to a UTC Date.
 */
function timezoneTimeToDate(
  year: number,
  month: number,
  day: number,
  hours: number,
  minutes: number,
  timezone: string,
): Date {
  let guess = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0));

  for (let i = 0; i < 2; i++) {
    const inTz = getTimeInTimezone(guess, timezone);
    const tzAsUtc = Date.UTC(inTz.year, inTz.month - 1, inTz.day, inTz.hours, inTz.minutes, 0);
    const targetAsUtc = Date.UTC(year, month - 1, day, hours, minutes, 0);
    const diffMs = targetAsUtc - tzAsUtc;
    if (diffMs === 0) break;
    guess = new Date(guess.getTime() + diffMs);
  }

  return guess;
}

/**
 * Check if a day-of-week (0=Sun, 6=Sat) is a weekday.
 */
function isWeekday(dayOfWeek: number): boolean {
  return dayOfWeek >= 1 && dayOfWeek <= 5;
}

/**
 * Get full promo status for the given config and time.
 */
export function getPromoStatus(config: PromoConfig, now?: Date): PromoStatus {
  const currentTime = now ?? new Date();
  const promo = getActivePromo(config, currentTime);

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

  if (!promo) return noPromo;

  const { peakHours } = promo;
  const tz = peakHours.timezone;

  const tzTime = getTimeInTimezone(currentTime, tz);
  const currentMinutesInDay = tzTime.hours * 60 + tzTime.minutes;

  const peakStart = parseTime(peakHours.start);
  const peakEnd = parseTime(peakHours.end);
  const peakStartMinutes = peakStart.hours * 60 + peakStart.minutes;
  const peakEndMinutes = peakEnd.hours * 60 + peakEnd.minutes;

  const promoEndDate = new Date(promo.endDate);

  const isDuringWeekday = isWeekday(tzTime.dayOfWeek);
  const isInPeakTimeRange = currentMinutesInDay >= peakStartMinutes && currentMinutesInDay < peakEndMinutes;

  const peakActive = peakHours.weekdaysOnly
    ? (isDuringWeekday && isInPeakTimeRange)
    : isInPeakTimeRange;

  const bonusActive = !peakActive;
  const multiplier = bonusActive ? promo.multiplier : 1;

  let minutesRemaining = 0;
  let minutesUntilBonus = 0;
  let windowEndLocal: Date | null = null;
  let nextBonusStartLocal: Date | null = null;

  if (bonusActive) {
    if (peakHours.weekdaysOnly) {
      let daysUntilNextPeak = 0;
      if (isDuringWeekday && currentMinutesInDay < peakStartMinutes) {
        daysUntilNextPeak = 0;
      } else if (isDuringWeekday && currentMinutesInDay >= peakEndMinutes) {
        daysUntilNextPeak = 1;
        let nextDay = (tzTime.dayOfWeek + 1) % 7;
        while (!isWeekday(nextDay)) {
          daysUntilNextPeak++;
          nextDay = (nextDay + 1) % 7;
        }
      } else {
        daysUntilNextPeak = 1;
        let nextDay = (tzTime.dayOfWeek + 1) % 7;
        while (!isWeekday(nextDay)) {
          daysUntilNextPeak++;
          nextDay = (nextDay + 1) % 7;
        }
      }

      const nextPeakDate = timezoneTimeToDate(
        tzTime.year, tzTime.month, tzTime.day + daysUntilNextPeak,
        peakStart.hours, peakStart.minutes, tz,
      );

      const effectiveEnd = nextPeakDate.getTime() < promoEndDate.getTime()
        ? nextPeakDate : promoEndDate;

      minutesRemaining = Math.max(0, Math.round(
        (effectiveEnd.getTime() - currentTime.getTime()) / 60_000,
      ));
      windowEndLocal = effectiveEnd;
    } else {
      let daysUntilPeak = 0;
      if (currentMinutesInDay >= peakEndMinutes) {
        daysUntilPeak = 1;
      }
      const nextPeakDate = timezoneTimeToDate(
        tzTime.year, tzTime.month, tzTime.day + daysUntilPeak,
        peakStart.hours, peakStart.minutes, tz,
      );
      const effectiveEnd = nextPeakDate.getTime() < promoEndDate.getTime()
        ? nextPeakDate : promoEndDate;
      minutesRemaining = Math.max(0, Math.round(
        (effectiveEnd.getTime() - currentTime.getTime()) / 60_000,
      ));
      windowEndLocal = effectiveEnd;
    }
  } else {
    const peakEndDate = timezoneTimeToDate(
      tzTime.year, tzTime.month, tzTime.day,
      peakEnd.hours, peakEnd.minutes, tz,
    );
    minutesUntilBonus = Math.max(0, Math.round(
      (peakEndDate.getTime() - currentTime.getTime()) / 60_000,
    ));
    nextBonusStartLocal = peakEndDate;
  }

  let bonusProgress = 0;
  if (bonusActive && minutesRemaining > 0) {
    if (peakHours.weekdaysOnly && !isDuringWeekday) {
      const totalWindowMinutes = calculateBonusWindowDuration(
        tzTime, peakStartMinutes, peakEndMinutes, peakHours.weekdaysOnly,
      );
      if (totalWindowMinutes > 0) {
        bonusProgress = Math.min(1, 1 - (minutesRemaining / totalWindowMinutes));
      }
    } else {
      const totalWindowMinutes = (24 * 60) - (peakEndMinutes - peakStartMinutes);
      if (totalWindowMinutes > 0) {
        bonusProgress = Math.min(1, 1 - (minutesRemaining / totalWindowMinutes));
      }
    }
  }

  return {
    hasActivePromo: true,
    promo,
    bonusActive,
    multiplier,
    minutesRemaining,
    minutesUntilBonus,
    windowEndLocal,
    nextBonusStartLocal,
    promoEndDate,
    bonusProgress,
  };
}

/**
 * Estimate total bonus window duration in minutes for progress calculation.
 */
function calculateBonusWindowDuration(
  tzTime: { dayOfWeek: number },
  peakStartMinutes: number,
  peakEndMinutes: number,
  weekdaysOnly: boolean,
): number {
  if (weekdaysOnly && !isWeekday(tzTime.dayOfWeek)) {
    return (24 * 60 - peakEndMinutes) + (2 * 24 * 60) + peakStartMinutes;
  }
  return (24 * 60) - (peakEndMinutes - peakStartMinutes);
}

/**
 * Format a duration in minutes as "Xh Ym".
 */
export function formatDuration(totalMinutes: number): string {
  if (totalMinutes <= 0) return '0m';
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.round(totalMinutes % 60);
  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}

/**
 * Format a date as local time with timezone name.
 */
export function formatLocalTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  });
}
