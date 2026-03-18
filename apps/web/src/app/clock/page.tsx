import LiveClock from '../components/LiveClock';
import Link from 'next/link';

export const metadata = {
  title: 'Live Clock — Claude Clock',
  description: 'Real-time view of the Claude 2x bonus window status in your timezone.',
};

export default function ClockPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-4">
      {/* Header */}
      <Link
        href="/"
        className="mb-8 text-sm text-gray-500 hover:text-gray-300 transition-colors"
      >
        <span className="text-yellow-400">&#9889;</span> claudeclock.com
      </Link>

      <LiveClock />
    </main>
  );
}
