import { createRequire } from 'node:module';
import type { PromoConfig } from './promo.js';

const require = createRequire(import.meta.url);

export const FALLBACK_CONFIG: PromoConfig = require('../../../shared/promo-config.json');

const PROMO_URL = 'https://claudeclock.com/api/promo';

export async function loadConfig(): Promise<PromoConfig> {
  try {
    const res = await fetch(PROMO_URL, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as PromoConfig;
  } catch {
    return FALLBACK_CONFIG;
  }
}
