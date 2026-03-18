import LiveClock from '../components/LiveClock';
import Link from 'next/link';

export const metadata = {
  title: 'Live Clock — Claude Clock',
  description: 'Real-time countdown for Claude\'s 2× bonus window in your timezone.',
};

export default function ClockPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-4">
      <Link
        href="/"
        className="mb-6 text-xs text-gray-600 hover:text-gray-400 transition-colors uppercase tracking-widest"
      >
        Claude Clock
      </Link>

      <LiveClock />
    </main>
  );
}
