import { describe, it, expect } from 'vitest';
import {
  getActivePromo,
  getPromoStatus,
  formatDuration,
  formatLocalTime,
  type PromoConfig,
} from './promo.js';

const TEST_CONFIG: PromoConfig = {
  version: 1,
  promos: [{
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
  }],
};

describe('getActivePromo', () => {
  it('returns promo when current date is within range', () => {
    // March 15 2026 is within Mar 13 - Mar 28
    const now = new Date('2026-03-15T12:00:00-07:00');
    const promo = getActivePromo(TEST_CONFIG, now);
    expect(promo).not.toBeNull();
    expect(promo!.id).toBe('test-promo');
  });

  it('returns null when no promo is active (after end date)', () => {
    const now = new Date('2026-03-29T12:00:00-07:00');
    const promo = getActivePromo(TEST_CONFIG, now);
    expect(promo).toBeNull();
  });

  it('returns null before promo starts', () => {
    const now = new Date('2026-03-12T23:00:00-07:00');
    const promo = getActivePromo(TEST_CONFIG, now);
    expect(promo).toBeNull();
  });
});

describe('getPromoStatus', () => {
  it('returns bonus active during off-peak weekday (3 PM PT Wednesday)', () => {
    // March 18, 2026 is a Wednesday. 3 PM PT is outside peak (5-11 AM PT)
    const now = new Date('2026-03-18T15:00:00-07:00');
    const status = getPromoStatus(TEST_CONFIG, now);
    expect(status.hasActivePromo).toBe(true);
    expect(status.bonusActive).toBe(true);
    expect(status.multiplier).toBe(2);
  });

  it('returns bonus inactive during peak weekday (8 AM PT Wednesday)', () => {
    // March 18, 2026 is a Wednesday. 8 AM PT is within peak (5-11 AM PT)
    const now = new Date('2026-03-18T08:00:00-07:00');
    const status = getPromoStatus(TEST_CONFIG, now);
    expect(status.hasActivePromo).toBe(true);
    expect(status.bonusActive).toBe(false);
    expect(status.multiplier).toBe(1);
  });

  it('returns bonus active on weekends (Saturday 9 AM PT)', () => {
    // March 21, 2026 is a Saturday. 9 AM PT would be peak on weekday but weekends have no peak
    const now = new Date('2026-03-21T09:00:00-07:00');
    const status = getPromoStatus(TEST_CONFIG, now);
    expect(status.hasActivePromo).toBe(true);
    expect(status.bonusActive).toBe(true);
    expect(status.multiplier).toBe(2);
  });

  it('returns bonus active just after peak ends (11:01 AM PT)', () => {
    // March 18, 2026 is a Wednesday. 11:01 AM PT is just after peak ends
    const now = new Date('2026-03-18T11:01:00-07:00');
    const status = getPromoStatus(TEST_CONFIG, now);
    expect(status.hasActivePromo).toBe(true);
    expect(status.bonusActive).toBe(true);
  });

  it('returns bonus inactive at peak start (5:00 AM PT)', () => {
    // March 18, 2026 is a Wednesday. 5:00 AM PT is when peak starts
    const now = new Date('2026-03-18T05:00:00-07:00');
    const status = getPromoStatus(TEST_CONFIG, now);
    expect(status.hasActivePromo).toBe(true);
    expect(status.bonusActive).toBe(false);
  });

  it('returns no promo status when outside promo dates', () => {
    const now = new Date('2026-04-01T12:00:00-07:00');
    const status = getPromoStatus(TEST_CONFIG, now);
    expect(status.hasActivePromo).toBe(false);
    expect(status.bonusActive).toBe(false);
    expect(status.promo).toBeNull();
    expect(status.multiplier).toBe(1);
  });

  it('NZ timezone: 10 AM NZDT working hours are in bonus window', () => {
    // 10 AM NZDT (UTC+13) = March 18 2026 10:00 NZDT = March 17 2026 21:00 UTC
    // = March 17 2026 14:00 PDT (UTC-7)
    // That's 2 PM PT on a Tuesday — outside peak hours (5-11 AM), so bonus is active
    const now = new Date('2026-03-18T10:00:00+13:00');
    const status = getPromoStatus(TEST_CONFIG, now);
    expect(status.hasActivePromo).toBe(true);
    expect(status.bonusActive).toBe(true);
    expect(status.multiplier).toBe(2);
  });
});

describe('formatDuration', () => {
  it('formats hours and minutes', () => {
    expect(formatDuration(90)).toBe('1h 30m');
  });

  it('formats minutes only', () => {
    expect(formatDuration(45)).toBe('45m');
  });

  it('formats hours only', () => {
    expect(formatDuration(120)).toBe('2h 0m');
  });

  it('formats zero', () => {
    expect(formatDuration(0)).toBe('0m');
  });
});

describe('formatLocalTime', () => {
  it('formats a date with timezone name', () => {
    const date = new Date('2026-03-18T15:00:00-07:00');
    const result = formatLocalTime(date);
    // Should contain time and timezone info
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});
