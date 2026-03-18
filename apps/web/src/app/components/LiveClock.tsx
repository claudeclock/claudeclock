'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  type PromoConfig,
  type PromoStatus,
  getPromoStatus,
  formatDuration,
} from '../../lib/promo';

function formatTimeOnly(date: Date): string {
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

interface LiveClockProps {
  /** Render in compact inline mode (for homepage hero) vs full page mode */
  inline?: boolean;
}

export default function LiveClock({ inline = false }: LiveClockProps) {
  const [config, setConfig] = useState<PromoConfig | null>(null);
  const [status, setStatus] = useState<PromoStatus | null>(null);

  useEffect(() => {
    fetch('/api/promo')
      .then(res => res.json())
      .then((data: PromoConfig) => setConfig(data))
      .catch(() => {});
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

  if (!status || !status.hasActivePromo) {
    return (
      <div className="rounded-2xl border border-gray-800 bg-gray-900/80 backdrop-blur p-6 text-center">
        <p className="text-gray-500">Loading status...</p>
      </div>
    );
  }

  if (inline) return <InlineStatus status={status} />;
  return <FullClockCard status={status} />;
}

/** Compact status for homepage hero */
function InlineStatus({ status }: { status: PromoStatus }) {
  if (status.bonusActive) {
    return (
      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/15 border border-green-500/30 px-3 py-1 text-sm font-semibold text-green-400">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            2&times; active now
          </span>
          <span className="text-gray-400 text-sm">
            {formatDuration(status.minutesRemaining)} remaining
          </span>
        </div>
        {/* Progress bar */}
        <div className="w-full max-w-xs h-1.5 rounded-full bg-gray-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-green-500 transition-all duration-1000"
            style={{ width: `${Math.max(1, status.bonusProgress * 100)}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/15 border border-orange-500/30 px-3 py-1 text-sm font-semibold text-orange-400">
        Peak hours
      </span>
      <span className="text-gray-400 text-sm">
        2&times; resumes in {formatDuration(status.minutesUntilBonus)}
      </span>
    </div>
  );
}

/** Full card for /clock page */
function FullClockCard({ status }: { status: PromoStatus }) {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const tzAbbrev = new Date().toLocaleTimeString('en-US', { timeZoneName: 'short' }).split(' ').pop();

  return (
    <div className="w-full max-w-md">
      <div className="rounded-2xl border border-gray-800 bg-gray-900/80 backdrop-blur overflow-hidden">
        {/* Status header */}
        {status.bonusActive ? (
          <div className="bg-green-500/10 border-b border-green-500/20 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
                <span className="font-semibold text-green-400">2&times; usage limits</span>
                <span className="text-xs font-bold text-green-300 bg-green-500/20 px-2 py-0.5 rounded">ACTIVE</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-orange-500/10 border-b border-orange-500/20 px-6 py-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-400" />
              <span className="font-semibold text-orange-400">Standard usage</span>
              <span className="text-xs font-bold text-orange-300 bg-orange-500/20 px-2 py-0.5 rounded">PEAK</span>
            </div>
          </div>
        )}

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {status.bonusActive ? (
            <>
              {/* Countdown */}
              <div>
                <div className="text-3xl font-bold tracking-tight">
                  {formatDuration(status.minutesRemaining)}
                </div>
                <p className="text-sm text-gray-400 mt-1">
                  remaining &middot; ends {status.windowEndLocal ? formatTimeOnly(status.windowEndLocal) : ''} your time
                </p>
              </div>

              {/* Progress */}
              <div>
                <div className="h-2 rounded-full bg-gray-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-green-500 transition-all duration-1000"
                    style={{ width: `${Math.max(1, status.bonusProgress * 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1.5">
                  {Math.round(status.bonusProgress * 100)}% through current window
                </p>
              </div>
            </>
          ) : (
            <div>
              <div className="text-3xl font-bold tracking-tight">
                {formatDuration(status.minutesUntilBonus)}
              </div>
              <p className="text-sm text-gray-400 mt-1">
                until 2&times; resumes &middot; {status.nextBonusStartLocal ? formatTimeOnly(status.nextBonusStartLocal) : ''} your time
              </p>
            </div>
          )}

          {/* Schedule */}
          <div className="border-t border-gray-800 pt-4 space-y-2.5">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Schedule</h3>

            {status.bonusActive && status.windowEndLocal && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Next peak hours</span>
                <span className="text-gray-300">{getRelativeDay(status.windowEndLocal)}, {formatTimeOnly(status.windowEndLocal)}</span>
              </div>
            )}

            {!status.bonusActive && status.nextBonusStartLocal && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">2&times; resumes</span>
                <span className="text-gray-300">{formatTimeTz(status.nextBonusStartLocal)}</span>
              </div>
            )}

            {status.promoEndDate && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Promo ends</span>
                <span className="text-gray-300">
                  {status.promoEndDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
            )}

            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Your timezone</span>
              <span className="text-gray-300">{tzAbbrev}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Below card actions */}
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <a
          href="/downloads/ClaudeClock.dmg"
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          Download Mac app
        </a>
        <span className="text-gray-700">&middot;</span>
        <a
          href="https://www.npmjs.com/package/claudeclock"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          Install CLI
        </a>
        <span className="text-gray-700">&middot;</span>
        <a
          href="https://support.claude.com/en/articles/14063676-claude-march-2026-usage-promotion"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          View current promo
        </a>
      </div>
    </div>
  );
}
