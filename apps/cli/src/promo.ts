// Core promo status logic with timezone handling.
// Shared brain used by CLI, web, and menu bar apps.

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
  // Use Intl.DateTimeFormat to get components in the target timezone
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
  // Intl with hour12:false can return 24 for midnight
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
  // Create a rough UTC guess, then adjust using the timezone offset
  // We use a binary-search-free approach: format a known date to find offset
  const guess = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0));

  // Get what time `guess` is in the target timezone
  const inTz = getTimeInTimezone(guess, timezone);
  const guessMinutes = inTz.hours * 60 + inTz.minutes;
  const targetMinutes = hours * 60 + minutes;
  const diffMinutes = targetMinutes - guessMinutes;

  // Adjust: if the timezone shows a different time, shift accordingly
  return new Date(guess.getTime() - diffMinutes * 60_000);
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

  // Get current time in the peak timezone
  const tzTime = getTimeInTimezone(currentTime, tz);
  const currentMinutesInDay = tzTime.hours * 60 + tzTime.minutes;

  const peakStart = parseTime(peakHours.start);
  const peakEnd = parseTime(peakHours.end);
  const peakStartMinutes = peakStart.hours * 60 + peakStart.minutes;
  const peakEndMinutes = peakEnd.hours * 60 + peakEnd.minutes;

  const promoEndDate = new Date(promo.endDate);

  // Check if we're in a peak window
  const isDuringWeekday = isWeekday(tzTime.dayOfWeek);
  const isInPeakTimeRange = currentMinutesInDay >= peakStartMinutes && currentMinutesInDay < peakEndMinutes;

  // If weekdaysOnly, peak only applies on weekdays
  const peakActive = peakHours.weekdaysOnly
    ? (isDuringWeekday && isInPeakTimeRange)
    : isInPeakTimeRange;

  const bonusActive = !peakActive;
  const multiplier = bonusActive ? promo.multiplier : 1;

  // Calculate timing info
  let minutesRemaining = 0;
  let minutesUntilBonus = 0;
  let windowEndLocal: Date | null = null;
  let nextBonusStartLocal: Date | null = null;

  if (bonusActive) {
    // Bonus is active. How long until peak starts?
    // Find the next peak start time
    if (peakHours.weekdaysOnly) {
      // Find next weekday peak start
      let daysUntilNextPeak = 0;
      if (isDuringWeekday && currentMinutesInDay < peakStartMinutes) {
        // Today is a weekday and peak hasn't started yet — peak starts today
        daysUntilNextPeak = 0;
      } else if (isDuringWeekday && currentMinutesInDay >= peakEndMinutes) {
        // After peak today. Next peak is tomorrow if weekday, else next Monday
        daysUntilNextPeak = 1;
        let nextDay = (tzTime.dayOfWeek + 1) % 7;
        while (!isWeekday(nextDay)) {
          daysUntilNextPeak++;
          nextDay = (nextDay + 1) % 7;
        }
      } else {
        // Weekend — find next Monday
        daysUntilNextPeak = 1;
        let nextDay = (tzTime.dayOfWeek + 1) % 7;
        while (!isWeekday(nextDay)) {
          daysUntilNextPeak++;
          nextDay = (nextDay + 1) % 7;
        }
      }

      // Window end = next peak start (the bonus window ends when peak begins)
      const nextPeakDate = timezoneTimeToDate(
        tzTime.year, tzTime.month, tzTime.day + daysUntilNextPeak,
        peakStart.hours, peakStart.minutes, tz,
      );

      // Cap at promo end
      const effectiveEnd = nextPeakDate.getTime() < promoEndDate.getTime()
        ? nextPeakDate : promoEndDate;

      minutesRemaining = Math.max(0, Math.round(
        (effectiveEnd.getTime() - currentTime.getTime()) / 60_000,
      ));
      windowEndLocal = effectiveEnd;
    } else {
      // Peak applies every day — next peak start is today or tomorrow
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
    // Peak is active (standard rate). How long until bonus starts?
    // Bonus starts when peak ends
    const peakEndDate = timezoneTimeToDate(
      tzTime.year, tzTime.month, tzTime.day,
      peakEnd.hours, peakEnd.minutes, tz,
    );
    minutesUntilBonus = Math.max(0, Math.round(
      (peakEndDate.getTime() - currentTime.getTime()) / 60_000,
    ));
    nextBonusStartLocal = peakEndDate;
  }

  // Calculate bonus progress (0-1) within the current bonus window
  let bonusProgress = 0;
  if (bonusActive && minutesRemaining > 0) {
    // Total bonus window duration depends on context
    // For simplicity: progress = time elapsed in window / total window duration
    // We know the window ends at windowEndLocal. The window started at the last peak end.
    // For a more accurate calculation, find window start
    if (peakHours.weekdaysOnly && !isDuringWeekday) {
      // Weekend: bonus started Friday at peak end (or Saturday midnight)
      // Simplified: just use a ratio based on time until end
      const totalWindowMinutes = calculateBonusWindowDuration(
        tzTime, peakStartMinutes, peakEndMinutes, peakHours.weekdaysOnly,
      );
      if (totalWindowMinutes > 0) {
        bonusProgress = Math.min(1, 1 - (minutesRemaining / totalWindowMinutes));
      }
    } else {
      // Weekday off-peak: window is from peak end to next peak start (next day)
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
    // Weekend: bonus runs from Friday peak-end through Sunday midnight to Monday peak-start
    // Friday: (24*60 - peakEndMinutes) + Saturday: 24*60 + Sunday: 24*60 + Monday: peakStartMinutes
    // But depends on which day we're on — simplify
    const peakDuration = peakEndMinutes - peakStartMinutes;
    // Fri after peak + Sat + Sun + Mon before peak
    return (24 * 60 - peakEndMinutes) + (2 * 24 * 60) + peakStartMinutes;
  }
  // Weekday: bonus = 24h - peak duration
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
