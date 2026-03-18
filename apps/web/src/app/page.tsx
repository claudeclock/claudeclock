import Link from 'next/link';
import HeroMessage from './components/HeroMessage';
import { HeroStatus, HeroBadge } from './components/LiveClock';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="mx-auto max-w-4xl px-6 py-20 md:py-28">

        {/* ── Hero: two columns ── */}
        <section className="mb-20 grid md:grid-cols-2 gap-10 md:gap-16 items-start">
          {/* Left: branding + pitch */}
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight mb-4">
              <span className="text-yellow-400">&#9889;</span> Claude Clock
            </h1>
            <p className="text-lg md:text-xl text-gray-200 leading-relaxed mb-2">
              Know exactly when Claude&apos;s 2&times; bonus window is live{' '}
              <HeroMessage />
            </p>
            <p className="text-gray-500">
              Anthropic is doubling usage limits outside peak hours.
              See the countdown, not the math.
            </p>
          </div>

          {/* Right: live status + CTAs */}
          <div>
            <HeroBadge />
            <div className="mt-3 mb-6">
              <HeroStatus />
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/clock"
                className="rounded-lg bg-yellow-400 text-gray-950 font-semibold px-4 py-2 text-sm hover:bg-yellow-300 transition-colors"
              >
                Open live clock
              </Link>
              <a
                href="/downloads/ClaudeClock.dmg"
                className="rounded-lg border border-gray-700 text-gray-300 font-medium px-4 py-2 text-sm hover:border-gray-500 hover:text-white transition-colors"
              >
                Mac app
              </a>
              <a
                href="https://www.npmjs.com/package/claudeclock"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-gray-700 text-gray-300 font-medium px-4 py-2 text-sm hover:border-gray-500 hover:text-white transition-colors font-mono"
              >
                npm i -g claudeclock
              </a>
            </div>
          </div>
        </section>

        {/* ── Choose your format: three columns ── */}
        <section className="mb-20">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest text-center mb-6">
            Choose your format
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {/* Web clock */}
            <Link href="/clock" className="group block">
              <div className="rounded-xl border border-gray-800 hover:border-gray-600 bg-gray-900/40 overflow-hidden transition-colors h-full">
                <div className="p-5">
                  <h3 className="font-semibold group-hover:text-yellow-400 transition-colors mb-1">
                    Live web clock
                  </h3>
                  <p className="text-sm text-gray-500">
                    Browser-based. No install. Open and go.
                  </p>
                </div>
                <div className="border-t border-gray-800 bg-gray-900/60 px-5 py-3">
                  <div className="rounded-lg bg-gray-950 border border-gray-800 p-3">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                      <span className="text-[10px] text-green-400 font-medium">2&times; active</span>
                    </div>
                    <p className="text-sm font-bold tracking-tight">4h 52m</p>
                    <div className="h-1 rounded-full bg-gray-800 mt-1.5 overflow-hidden">
                      <div className="h-full rounded-full bg-green-500 w-3/5" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>

            {/* Mac app */}
            <a href="/downloads/ClaudeClock.dmg" className="group block">
              <div className="rounded-xl border border-gray-800 hover:border-gray-600 bg-gray-900/40 overflow-hidden transition-colors h-full">
                <div className="p-5">
                  <h3 className="font-semibold group-hover:text-yellow-400 transition-colors mb-1">
                    Mac menu bar app
                  </h3>
                  <p className="text-sm text-gray-500">
                    Glanceable. Lives in your menu bar all day.
                  </p>
                </div>
                <div className="border-t border-gray-800 bg-gray-900/60 px-5 py-3">
                  <div className="inline-flex items-center gap-3 rounded-lg bg-gray-950 border border-gray-800 px-3 py-2">
                    <span className="text-sm text-yellow-400">&#9889;</span>
                    <span className="text-sm font-semibold">2X</span>
                    <span className="text-sm text-gray-400">4h 52m</span>
                  </div>
                </div>
              </div>
            </a>

            {/* CLI */}
            <div className="rounded-xl border border-gray-800 bg-gray-900/40 overflow-hidden h-full">
              <div className="p-5">
                <h3 className="font-semibold mb-1">Terminal CLI</h3>
                <p className="text-sm text-gray-500">
                  Quick checks. Live dashboard. JSON output.
                </p>
              </div>
              <div className="border-t border-gray-800 bg-gray-900/60 px-5 py-3">
                <div className="rounded-lg bg-gray-950 border border-gray-800 p-3 font-mono text-[11px]">
                  <p className="text-gray-600">$ claudeclock</p>
                  <p className="text-green-400 mt-0.5">&#9889; 2&times; active &mdash; 4h 52m</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── What's this all about? ── */}
        <section className="mb-16">
          <h2 className="text-lg font-semibold mb-3">What&apos;s this all about?</h2>
          <p className="text-gray-400 leading-relaxed">
            Anthropic is temporarily doubling Claude usage limits outside peak
            Pacific hours (weekdays 5&ndash;11 AM PT, through March 28).
            Claude Clock converts that into your local timezone so you can see
            exactly when the bonus window is live.
            No account needed. No data collected.
          </p>
        </section>

        {/* ── FAQ ── */}
        <section className="mb-16">
          <h2 className="text-lg font-semibold mb-4">FAQ</h2>
          <div className="space-y-4 text-sm">
            <div>
              <p className="text-gray-300 font-medium">Is this official?</p>
              <p className="text-gray-500 mt-0.5">
                Unofficial. The promo is real &mdash; this just shows the times.
              </p>
            </div>
            <div>
              <p className="text-gray-300 font-medium">Does it work outside NZ?</p>
              <p className="text-gray-500 mt-0.5">
                Yes. Auto-detects your timezone. APAC benefits most.
              </p>
            </div>
            <div>
              <p className="text-gray-300 font-medium">Which plans?</p>
              <p className="text-gray-500 mt-0.5">
                Free, Pro, Max, Team. Not Enterprise.
              </p>
            </div>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="border-t border-gray-800/50 pt-6 space-y-4">
          <div className="flex flex-wrap gap-4 text-xs text-gray-600">
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
          </div>
          <p className="text-[10px] text-gray-700 leading-relaxed">
            Claude Clock is an independent, free tool with no association with
            Anthropic, PBC. Claude is a product of Anthropic. This tool simply
            converts publicly available promotion schedule information into local
            timezone displays. It does not access, store, or transmit any user data.
          </p>
        </footer>
      </div>
    </main>
  );
}
