'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  type PromoConfig,
  type PromoStatus,
  getPromoStatus,
  formatDuration,
} from '../../lib/promo';

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function formatTimeTz(date: Date): string {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' });
}

function getRelativeDay(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diff = Math.round((target.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  return date.toLocaleDateString('en-US', { weekday: 'long' });
}

function usePromoStatus() {
  const [config, setConfig] = useState<PromoConfig | null>(null);
  const [status, setStatus] = useState<PromoStatus | null>(null);

  useEffect(() => {
    fetch('/api/promo')
      .then(res => {
        if (!res.ok) throw new Error('fetch failed');
        return res.json();
      })
      .then((data: PromoConfig) => setConfig(data))
      .catch(() => {
        // Fallback: retry from same endpoint after short delay
        setTimeout(() => {
          fetch('/api/promo')
            .then(res => res.ok ? res.json() : null)
            .then((data) => { if (data) setConfig(data as PromoConfig); })
            .catch(() => {});
        }, 3000);
      });
  }, []);

  const tick = useCallback(() => {
    if (config) setStatus(getPromoStatus(config));
  }, [config]);

  useEffect(() => {
    if (!config) return;
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [config, tick]);

  return status;
}

// ─── Hero inline status (for homepage) ───

export function HeroStatus() {
  const status = usePromoStatus();

  if (!status || !status.hasActivePromo) {
    return <div className="h-12" />;
  }

  if (status.bonusActive) {
    return (
      <div className="space-y-3">
        <div className="flex items-baseline gap-3 flex-wrap">
          <span className="text-3xl md:text-4xl font-bold tracking-tight text-white">
            {formatDuration(status.minutesRemaining)}
          </span>
          <span className="text-gray-400">remaining</span>
        </div>
        <div className="h-1.5 rounded-full bg-gray-800 overflow-hidden max-w-sm">
          <div
            className="h-full rounded-full bg-green-500 transition-all duration-1000"
            style={{ width: `${Math.max(2, status.bonusProgress * 100)}%` }}
          />
        </div>
        {status.windowEndLocal && (
          <p className="text-sm text-gray-500">
            Ends {formatTime(status.windowEndLocal)} your time
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex items-baseline gap-3 flex-wrap">
        <span className="text-3xl md:text-4xl font-bold tracking-tight text-white">
          {formatDuration(status.minutesUntilBonus)}
        </span>
        <span className="text-gray-400">until 2&times; resumes</span>
      </div>
      {status.nextBonusStartLocal && (
        <p className="text-sm text-gray-500">
          Resumes {formatTime(status.nextBonusStartLocal)} your time
        </p>
      )}
    </div>
  );
}

export function HeroBadge() {
  const status = usePromoStatus();

  if (!status || !status.hasActivePromo) return null;

  if (status.bonusActive) {
    return (
      <span className="inline-flex items-center gap-2 text-green-400 text-lg font-semibold">
        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        2&times; active
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 text-orange-400 text-lg font-semibold">
      <span className="w-2 h-2 rounded-full bg-orange-400" />
      Peak hours
    </span>
  );
}

// ─── Full clock card (for /clock page) ───

export default function LiveClock() {
  const status = usePromoStatus();
  const tzAbbrev = typeof window !== 'undefined'
    ? new Date().toLocaleTimeString('en-US', { timeZoneName: 'short' }).split(' ').pop()
    : '';
  const now = new Date();
  const currentTime = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' });

  const [time, setTime] = useState(currentTime);
  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!status || !status.hasActivePromo) {
    return (
      <div className="rounded-2xl border border-gray-800 bg-gray-900/80 backdrop-blur p-8 text-center w-full max-w-md">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <div className="rounded-2xl border border-gray-800 bg-gray-900/80 backdrop-blur overflow-hidden">
        {/* Status bar */}
        {status.bonusActive ? (
          <div className="bg-green-500/10 border-b border-green-500/20 px-6 py-3 flex items-center justify-between">
            <span className="flex items-center gap-2 font-semibold text-green-400 text-sm">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              2&times; bonus window active
            </span>
            <span className="text-xs text-gray-500">{tzAbbrev}</span>
          </div>
        ) : (
          <div className="bg-orange-500/10 border-b border-orange-500/20 px-6 py-3 flex items-center justify-between">
            <span className="flex items-center gap-2 font-semibold text-orange-400 text-sm">
              <span className="w-2 h-2 rounded-full bg-orange-400" />
              Peak hours &mdash; standard usage
            </span>
            <span className="text-xs text-gray-500">{tzAbbrev}</span>
          </div>
        )}

        {/* Main content */}
        <div className="px-6 py-6">
          {/* Local time */}
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Your local time</p>
          <p className="text-2xl font-mono font-light text-gray-300 mb-6">{time}</p>

          {status.bonusActive ? (
            <>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Bonus window ends in</p>
              <p className="text-4xl font-bold tracking-tight mb-2">
                {formatDuration(status.minutesRemaining)}
              </p>
              {status.windowEndLocal && (
                <p className="text-sm text-gray-500 mb-5">
                  at {formatTime(status.windowEndLocal)} your time
                </p>
              )}
              <div className="h-2 rounded-full bg-gray-800 overflow-hidden mb-1">
                <div
                  className="h-full rounded-full bg-green-500 transition-all duration-1000"
                  style={{ width: `${Math.max(2, status.bonusProgress * 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-600">{Math.round(status.bonusProgress * 100)}% through window</p>
            </>
          ) : (
            <>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">2&times; bonus resumes in</p>
              <p className="text-4xl font-bold tracking-tight mb-2">
                {formatDuration(status.minutesUntilBonus)}
              </p>
              {status.nextBonusStartLocal && (
                <p className="text-sm text-gray-500">
                  at {formatTime(status.nextBonusStartLocal)} your time
                </p>
              )}
            </>
          )}
        </div>

        {/* Schedule */}
        <div className="border-t border-gray-800 px-6 py-4 space-y-2">
          {status.bonusActive && status.windowEndLocal && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Next peak hours</span>
              <span className="text-gray-300">{getRelativeDay(status.windowEndLocal)} {formatTime(status.windowEndLocal)}</span>
            </div>
          )}
          {!status.bonusActive && status.nextBonusStartLocal && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Bonus resumes</span>
              <span className="text-gray-300">{formatTimeTz(status.nextBonusStartLocal)}</span>
            </div>
          )}
          {status.promoEndDate && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Promo ends</span>
              <span className="text-gray-300">
                {status.promoEndDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Actions below card */}
      <div className="mt-5 flex justify-center gap-4 text-sm">
        <a href="/downloads/ClaudeClock.dmg" className="text-gray-500 hover:text-white transition-colors">
          Mac app
        </a>
        <span className="text-gray-800">&middot;</span>
        <a href="https://www.npmjs.com/package/claudeclock" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white transition-colors">
          CLI
        </a>
        <span className="text-gray-800">&middot;</span>
        <a href="https://support.claude.com/en/articles/14063676-claude-march-2026-usage-promotion" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white transition-colors">
          Promo details
        </a>
      </div>
    </div>
  );
}
