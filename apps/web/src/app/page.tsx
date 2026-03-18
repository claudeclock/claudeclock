import Link from 'next/link';
import HeroMessage from './components/HeroMessage';
import LiveClock from './components/LiveClock';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="mx-auto max-w-3xl px-6 py-16 md:py-24">

        {/* ── Hero ── */}
        <section className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            <span className="text-yellow-400">&#9889;</span> Claude Clock
          </h1>
          <p className="mt-4 text-lg text-gray-300 max-w-xl mx-auto">
            See exactly when Claude&apos;s 2&times; bonus window is live in your timezone.
          </p>
          {/* Status panel: two inner panels side by side */}
          <div className="mt-10 rounded-2xl border border-gray-800 bg-gray-900/60 backdrop-blur p-2 md:p-3">
            <div className="grid md:grid-cols-2 gap-2 md:gap-3">
              {/* Left: live status + timezone */}
              <div className="rounded-xl bg-gray-800/50 px-5 py-5">
                <div className="mb-4">
                  <LiveClock inline />
                </div>
                <HeroMessage />
              </div>

              {/* Right: actions */}
              <div className="rounded-xl bg-gray-800/50 px-5 py-5 flex flex-col justify-center gap-2.5">
                <Link
                  href="/clock"
                  className="rounded-lg bg-yellow-400 text-gray-950 font-semibold px-4 py-2.5 text-sm hover:bg-yellow-300 transition-colors text-center"
                >
                  Open live clock
                </Link>
                <a
                  href="/downloads/ClaudeClock.dmg"
                  className="rounded-lg border border-gray-700 text-gray-300 font-medium px-4 py-2.5 text-sm hover:border-gray-500 hover:text-white transition-colors text-center"
                >
                  Download Mac app
                </a>
                <a
                  href="https://www.npmjs.com/package/claudeclock"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-gray-700 text-gray-300 font-medium px-4 py-2.5 text-sm hover:border-gray-500 hover:text-white transition-colors text-center font-mono"
                >
                  npm i -g claudeclock
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ── What is this ── */}
        <section className="mb-16">
          <p className="text-gray-400 text-center max-w-lg mx-auto leading-relaxed">
            Anthropic is temporarily doubling Claude usage limits outside peak
            Pacific hours (weekdays 5&ndash;11 AM PT). Claude Clock converts that
            into your local timezone so you always know when the bonus window is live.
          </p>
        </section>

        {/* ── Three product modes ── */}
        <section className="mb-16">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-center mb-6">
            Choose your format
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {/* Web clock */}
            <Link
              href="/clock"
              className="group rounded-xl border border-gray-800 bg-gray-900/60 hover:border-gray-600 p-5 transition-colors"
            >
              <div className="text-2xl mb-3">&#127760;</div>
              <h3 className="font-semibold mb-1 group-hover:text-yellow-400 transition-colors">
                Web clock
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Instant browser-based countdown. No install, no friction.
              </p>
            </Link>

            {/* Mac app */}
            <a
              href="/downloads/ClaudeClock.dmg"
              className="group rounded-xl border border-gray-800 bg-gray-900/60 hover:border-gray-600 p-5 transition-colors"
            >
              <div className="text-2xl mb-3">&#128187;</div>
              <h3 className="font-semibold mb-1 group-hover:text-yellow-400 transition-colors">
                Mac app
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Lives in your menu bar. Glanceable 2&times; status all day.
              </p>
            </a>

            {/* CLI */}
            <div className="group rounded-xl border border-gray-800 bg-gray-900/60 p-5">
              <div className="text-2xl mb-3">&#9000;</div>
              <h3 className="font-semibold mb-1">CLI</h3>
              <p className="text-sm text-gray-400 leading-relaxed mb-3">
                Fast checks from terminal. Live dashboard or JSON output.
              </p>
              <code className="block rounded-lg bg-gray-800 text-green-400 px-3 py-2 font-mono text-xs">
                npm i -g claudeclock
              </code>
            </div>
          </div>
        </section>

        {/* ── FAQ-style trust answers ── */}
        <section className="mb-16">
          <div className="grid md:grid-cols-2 gap-x-8 gap-y-5 text-sm max-w-2xl mx-auto">
            <div>
              <h3 className="font-medium text-gray-300 mb-1">Is this official?</h3>
              <p className="text-gray-500">
                Unofficial. The promo is real &mdash; this tool just converts the times for your timezone.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-gray-300 mb-1">Does it track my Claude account?</h3>
              <p className="text-gray-500">
                No. It&apos;s pure timezone logic. No login, no account access, no data collection.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-gray-300 mb-1">Does it work outside NZ?</h3>
              <p className="text-gray-500">
                Yes. It detects your timezone automatically. APAC users benefit most, but it works anywhere.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-gray-300 mb-1">How long is the promo?</h3>
              <p className="text-gray-500">
                March 13&ndash;28, 2026. Free, Pro, Max, and Team plans. Not Enterprise.
              </p>
            </div>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="border-t border-gray-800 pt-6 flex flex-wrap justify-center gap-4 text-xs text-gray-500">
          <a
            href="https://support.claude.com/en/articles/14063676-claude-march-2026-usage-promotion"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-300 transition-colors"
          >
            View current promo
          </a>
          <span className="text-gray-700">&middot;</span>
          <a
            href="https://github.com/claudeclock/claudeclock"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-300 transition-colors"
          >
            GitHub
          </a>
        </footer>
      </div>
    </main>
  );
}
