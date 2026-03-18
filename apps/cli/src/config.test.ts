import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { PromoConfig } from './promo.js';

const MOCK_CONFIG: PromoConfig = {
  version: 1,
  promos: [{
    id: 'remote-promo',
    name: 'Remote Promo',
    description: 'Fetched from API',
    multiplier: 3,
    startDate: '2026-03-01T00:00:00-07:00',
    endDate: '2026-03-31T23:59:00-07:00',
    peakHours: {
      timezone: 'America/Los_Angeles',
      weekdaysOnly: true,
      start: '05:00',
      end: '11:00',
    },
    eligiblePlans: ['free', 'pro'],
    infoUrl: 'https://example.com',
  }],
};

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('loadConfig', () => {
  it('returns fetched config on success', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(MOCK_CONFIG),
    }));

    const { loadConfig } = await import('./config.js');
    const config = await loadConfig();
    expect(config).toEqual(MOCK_CONFIG);
    expect(fetch).toHaveBeenCalledWith(
      'https://claudeclock.com/api/promo',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it('returns fallback config when fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')));

    const { loadConfig, FALLBACK_CONFIG } = await import('./config.js');
    const config = await loadConfig();
    expect(config).toEqual(FALLBACK_CONFIG);
    expect(config.version).toBe(1);
    expect(config.promos.length).toBeGreaterThan(0);
  });

  it('returns fallback config when response is not ok', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({}),
    }));

    const { loadConfig, FALLBACK_CONFIG } = await import('./config.js');
    const config = await loadConfig();
    expect(config).toEqual(FALLBACK_CONFIG);
  });
});
