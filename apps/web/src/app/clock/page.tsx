import Link from 'next/link';
import LiveClock from '../components/LiveClock';

export const metadata = {
  title: 'Live Clock — Claude Clock',
  description: 'Real-time view of the Claude 2x bonus window status.',
};

export default function ClockPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-4">
      <LiveClock />
      <div className="mt-8">
        <Link
          href="/"
          className="text-gray-400 hover:text-gray-200 transition-colors text-sm"
        >
          &larr; Back to claudeclock.com
        </Link>
      </div>
    </main>
  );
}
