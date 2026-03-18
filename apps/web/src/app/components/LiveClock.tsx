'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  type PromoConfig,
  type PromoStatus,
  getPromoStatus,
  formatDuration,
  formatLocalTime,
} from '../../lib/promo';

export default function LiveClock() {
  const [config, setConfig] = useState<PromoConfig | null>(null);
  const [status, setStatus] = useState<PromoStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch config on mount
  useEffect(() => {
    fetch('/api/promo')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch promo config');
        return res.json();
      })
      .then((data: PromoConfig) => setConfig(data))
      .catch(err => setError(err.message));
  }, []);

  // Recalculate status every second
  const tick = useCallback(() => {
    if (config) {
      setStatus(getPromoStatus(config));
    }
  }, [config]);

  useEffect(() => {
    if (!config) return;
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [config, tick]);

  if (error) {
    return (
      <div className="rounded-xl border border-red-800 bg-gray-900 p-8 text-center">
        <p className="text-red-400">Failed to load promo data: {error}</p>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-8 text-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  if (!status.hasActivePromo) {
    return (
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">
          <span className="text-yellow-400">&#9889;</span> Claude Clock
        </h2>
        <p className="text-gray-400">No active promotion at this time.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-8 w-full max-w-lg">
      {/* Header */}
      <h2 className="text-2xl font-bold text-center mb-6">
        <span className="text-yellow-400">&#9889;</span> Claude Clock
      </h2>

      {status.bonusActive ? (
        <BonusActiveView status={status} />
      ) : (
        <StandardView status={status} />
      )}

      {/* Promo info */}
      {status.promo && (
        <div className="mt-6 pt-4 border-t border-gray-800 text-center text-sm text-gray-500">
          <p>{status.promo.name}</p>
          {status.promoEndDate && (
            <p>
              Ends{' '}
              {status.promoEndDate.toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function BonusActiveView({ status }: { status: PromoStatus }) {
  return (
    <div>
      {/* Status badge */}
      <div className="text-center mb-6">
        <span className="inline-block rounded-full bg-green-900/50 border border-green-700 text-green-400 px-4 py-2 text-lg font-bold tracking-wide">
          2X BONUS ACTIVE
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="h-3 rounded-full bg-gray-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-green-500 transition-all duration-1000"
            style={{ width: `${Math.max(1, status.bonusProgress * 100)}%` }}
          />
        </div>
      </div>

      {/* Details */}
      <div className="space-y-2 text-center">
        {status.windowEndLocal && (
          <p className="text-gray-300">
            Bonus ends at{' '}
            <span className="text-white font-semibold">
              {formatLocalTime(status.windowEndLocal)}
            </span>
          </p>
        )}
        <p className="text-gray-400">
          Time remaining:{' '}
          <span className="text-green-400 font-semibold">
            {formatDuration(status.minutesRemaining)}
          </span>
        </p>
      </div>
    </div>
  );
}

function StandardView({ status }: { status: PromoStatus }) {
  return (
    <div>
      {/* Status badge */}
      <div className="text-center mb-6">
        <span className="inline-block rounded-full bg-yellow-900/50 border border-yellow-700 text-yellow-400 px-4 py-2 text-lg font-bold tracking-wide">
          STANDARD (1X)
        </span>
      </div>

      {/* Details */}
      <div className="space-y-2 text-center">
        <p className="text-gray-300">
          Bonus resumes in{' '}
          <span className="text-yellow-400 font-semibold">
            {formatDuration(status.minutesUntilBonus)}
          </span>
        </p>
        {status.nextBonusStartLocal && (
          <p className="text-gray-400">
            Resumes at{' '}
            <span className="text-white font-semibold">
              {formatLocalTime(status.nextBonusStartLocal)}
            </span>
          </p>
        )}
      </div>
    </div>
  );
}
