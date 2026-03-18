import Link from 'next/link';
import HeroMessage from './components/HeroMessage';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="mx-auto max-w-4xl px-6 py-16 md:py-24">
        {/* Hero */}
        <section className="text-center mb-20">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
            <span className="text-yellow-400">&#9889;</span> Claude Clock
          </h1>
          <HeroMessage />
        </section>

        {/* What is this? */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-yellow-400 mb-4">What is this?</h2>
          <div className="space-y-4 text-gray-300 text-lg leading-relaxed">
            <p>
              Anthropic is running a promotional period where Claude usage limits are
              doubled outside of peak hours (weekdays 5 AM &ndash; 11 AM Pacific).
              That means evenings, nights, and weekends give you 2x the tokens.
            </p>
            <p>
              Claude Clock shows you exactly when the bonus window is active in your
              timezone so you can plan your usage. Available as a macOS menu bar app,
              a terminal CLI, and a live web clock.
            </p>
          </div>
        </section>

        {/* Downloads */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-yellow-400 mb-6">Download</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {/* macOS Menu Bar */}
            <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
              <h3 className="text-xl font-semibold mb-2">macOS Menu Bar App</h3>
              <p className="text-gray-400 mb-4">
                Lives in your menu bar. Glanceable status at all times.
              </p>
              <a
                href="/downloads/ClaudeClock.dmg"
                className="inline-block rounded-lg bg-yellow-400 text-gray-950 font-semibold px-6 py-3 hover:bg-yellow-300 transition-colors"
              >
                Download .dmg
              </a>
            </div>

            {/* Terminal CLI */}
            <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
              <h3 className="text-xl font-semibold mb-2">Terminal CLI</h3>
              <p className="text-gray-400 mb-4">
                Quick check from your terminal. Works on macOS, Linux, and Windows.
              </p>
              <code className="block rounded-lg bg-gray-800 text-green-400 px-4 py-3 font-mono text-sm">
                npm install -g claudeclock
              </code>
            </div>
          </div>
        </section>

        {/* Live clock link */}
        <section className="mb-16 text-center">
          <Link
            href="/clock"
            className="inline-flex items-center gap-2 text-xl text-yellow-400 hover:text-yellow-300 transition-colors font-semibold"
          >
            View live web clock <span aria-hidden="true">&rarr;</span>
          </Link>
        </section>

        {/* Footer */}
        <footer className="border-t border-gray-800 pt-8 text-center text-gray-500 text-sm">
          <a
            href="https://support.claude.com/en/articles/14063676-claude-march-2026-usage-promotion"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-300 transition-colors"
          >
            Official Anthropic promo details &rarr;
          </a>
        </footer>
      </div>
    </main>
  );
}
