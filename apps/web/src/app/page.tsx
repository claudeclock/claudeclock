import Link from 'next/link';
import HeroMessage from './components/HeroMessage';
import { HeroStatus, HeroBadge } from './components/LiveClock';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="mx-auto max-w-2xl px-6 py-20 md:py-32">

        {/* ── Hero ── */}
        <section className="mb-20">
          <p className="text-sm font-medium text-gray-500 uppercase tracking-widest mb-4">
            Claude Clock
          </p>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight mb-4">
            Know exactly when Claude&apos;s 2&times; bonus window is live{' '}
            <HeroMessage />
          </h1>
          <p className="text-gray-400 text-lg mb-8">
            Anthropic is doubling usage limits outside peak hours.
            See the countdown, not the math.
          </p>

          {/* Live status */}
          <div className="mb-8">
            <HeroBadge />
            <div className="mt-3">
              <HeroStatus />
            </div>
          </div>

          {/* CTAs */}
          <div className="flex flex-wrap gap-3">
            <Link
              href="/clock"
              className="rounded-lg bg-yellow-400 text-gray-950 font-semibold px-5 py-2.5 text-sm hover:bg-yellow-300 transition-colors"
            >
              Open live clock
            </Link>
            <a
              href="/downloads/ClaudeClock.dmg"
              className="rounded-lg border border-gray-700 text-gray-300 font-medium px-5 py-2.5 text-sm hover:border-gray-500 hover:text-white transition-colors"
            >
              Mac app
            </a>
            <a
              href="https://www.npmjs.com/package/claudeclock"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-gray-700 text-gray-300 font-medium px-5 py-2.5 text-sm hover:border-gray-500 hover:text-white transition-colors font-mono"
            >
              npm i -g claudeclock
            </a>
          </div>
        </section>

        {/* ── Product modes with visual previews ── */}
        <section className="mb-20 space-y-4">
          {/* Web clock */}
          <Link href="/clock" className="group block">
            <div className="rounded-xl border border-gray-800 hover:border-gray-600 bg-gray-900/40 overflow-hidden transition-colors">
              <div className="p-5 flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold group-hover:text-yellow-400 transition-colors mb-1">
                    Live web clock
                  </h3>
                  <p className="text-sm text-gray-500">
                    Browser-based. No install. Open and go.
                  </p>
                </div>
                <span className="text-xs text-gray-600 border border-gray-800 rounded px-2 py-1 shrink-0">
                  Recommended
                </span>
              </div>
              {/* Preview mockup */}
              <div className="border-t border-gray-800 bg-gray-900/60 px-5 py-4">
                <div className="rounded-lg bg-gray-950 border border-gray-800 p-4 max-w-xs">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                    <span className="text-xs text-green-400 font-medium">2&times; bonus window active</span>
                  </div>
                  <p className="text-xs text-gray-600 mb-0.5">Ends in</p>
                  <p className="text-lg font-bold tracking-tight">4h 52m</p>
                  <div className="h-1 rounded-full bg-gray-800 mt-2 overflow-hidden">
                    <div className="h-full rounded-full bg-green-500 w-3/5" />
                  </div>
                </div>
              </div>
            </div>
          </Link>

          {/* Mac app */}
          <a href="/downloads/ClaudeClock.dmg" className="group block">
            <div className="rounded-xl border border-gray-800 hover:border-gray-600 bg-gray-900/40 overflow-hidden transition-colors">
              <div className="p-5 flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold group-hover:text-yellow-400 transition-colors mb-1">
                    Mac menu bar app
                  </h3>
                  <p className="text-sm text-gray-500">
                    Glanceable status. Lives in your menu bar all day.
                  </p>
                </div>
                <span className="text-xs text-gray-600 border border-gray-800 rounded px-2 py-1 shrink-0">
                  .dmg
                </span>
              </div>
              {/* Preview mockup */}
              <div className="border-t border-gray-800 bg-gray-900/60 px-5 py-4">
                <div className="inline-flex items-center gap-4 rounded-lg bg-gray-950 border border-gray-800 px-4 py-2.5">
                  <span className="text-sm font-medium text-yellow-400">&#9889;</span>
                  <span className="text-sm font-semibold">2X</span>
                  <span className="text-sm text-gray-400">4h 52m</span>
                  <span className="text-xs text-gray-600">|</span>
                  <span className="text-xs text-gray-500">Menu bar</span>
                </div>
              </div>
            </div>
          </a>

          {/* CLI */}
          <div className="rounded-xl border border-gray-800 bg-gray-900/40 overflow-hidden">
            <div className="p-5">
              <h3 className="font-semibold mb-1">Terminal CLI</h3>
              <p className="text-sm text-gray-500">
                Quick checks. Live dashboard. JSON output for scripting.
              </p>
            </div>
            {/* Preview mockup */}
            <div className="border-t border-gray-800 bg-gray-900/60 px-5 py-4">
              <div className="rounded-lg bg-gray-950 border border-gray-800 p-4 font-mono text-xs">
                <p className="text-gray-500">$ claudeclock</p>
                <p className="text-green-400 mt-1">&#9889; 2&times; active &mdash; 4h 52m remaining</p>
                <p className="text-gray-600 mt-0.5">&nbsp; Ends 1:00 AM NZDT</p>
                <p className="text-gray-700 mt-2">$ npm i -g claudeclock</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── One-line explanation ── */}
        <section className="mb-16">
          <p className="text-gray-500 text-sm leading-relaxed">
            Anthropic is temporarily doubling Claude usage limits outside peak
            Pacific hours (weekdays 5&ndash;11 AM PT, through March 28).
            Claude Clock converts that into your local timezone.
            No account needed. No data collected.
          </p>
        </section>

        {/* ── FAQ ── */}
        <section className="mb-16 space-y-4 text-sm">
          <div className="flex gap-2">
            <span className="text-gray-600 shrink-0">Q</span>
            <div>
              <p className="text-gray-300">Is this official?</p>
              <p className="text-gray-600 mt-0.5">Unofficial. The promo is real &mdash; this just shows the times.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <span className="text-gray-600 shrink-0">Q</span>
            <div>
              <p className="text-gray-300">Does it work outside NZ?</p>
              <p className="text-gray-600 mt-0.5">Yes. Auto-detects your timezone. APAC benefits most.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <span className="text-gray-600 shrink-0">Q</span>
            <div>
              <p className="text-gray-300">Which plans?</p>
              <p className="text-gray-600 mt-0.5">Free, Pro, Max, Team. Not Enterprise.</p>
            </div>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="border-t border-gray-800/50 pt-6 flex flex-wrap gap-4 text-xs text-gray-600">
          <a
            href="https://support.claude.com/en/articles/14063676-claude-march-2026-usage-promotion"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-400 transition-colors"
          >
            Promo details
          </a>
          <a
            href="https://github.com/claudeclock/claudeclock"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-400 transition-colors"
          >
            GitHub
          </a>
        </footer>
      </div>
    </main>
  );
}
