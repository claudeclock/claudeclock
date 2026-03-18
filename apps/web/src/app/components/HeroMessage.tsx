'use client';

import { useEffect, useState } from 'react';

const APAC_TIMEZONE_MAP: Record<string, string> = {
  'Pacific/Auckland': 'New Zealand',
  'Pacific/Chatham': 'New Zealand',
  'Australia/Sydney': 'Sydney',
  'Australia/Melbourne': 'Melbourne',
  'Australia/Brisbane': 'Brisbane',
  'Australia/Hobart': 'Tasmania',
  'Australia/Adelaide': 'Adelaide',
  'Australia/Perth': 'Perth',
  'Australia/Darwin': 'Darwin',
  'Asia/Tokyo': 'Tokyo',
  'Asia/Seoul': 'Seoul',
  'Asia/Singapore': 'Singapore',
  'Asia/Hong_Kong': 'Hong Kong',
  'Asia/Taipei': 'Taipei',
  'Asia/Shanghai': 'China',
  'Asia/Manila': 'Manila',
  'Asia/Bangkok': 'Bangkok',
  'Asia/Jakarta': 'Jakarta',
  'Asia/Kuala_Lumpur': 'Malaysia',
  'Asia/Ho_Chi_Minh': 'Vietnam',
};

// Timezones at UTC+8 or higher that get "most of your working day" message
const APAC_HIGH_OFFSET_PREFIXES = [
  'Asia/',
  'Australia/',
  'Pacific/Auckland',
  'Pacific/Chatham',
  'Pacific/Fiji',
  'Pacific/Tongatapu',
];

function getTimezoneMessage(tz: string): string {
  // Check specific timezone mapping first
  const region = APAC_TIMEZONE_MAP[tz];
  if (region) {
    return `You're in ${region} \u2014 your working day IS the bonus window.`;
  }

  // Check if it's a broad APAC timezone
  const isApac = APAC_HIGH_OFFSET_PREFIXES.some(prefix => tz.startsWith(prefix));
  if (isApac) {
    return "You're in the APAC region \u2014 most of your working day falls in the bonus window.";
  }

  return 'Check your local bonus window times below.';
}

export default function HeroMessage() {
  const [timezone, setTimezone] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setTimezone(tz);
    setMessage(getTimezoneMessage(tz));
  }, []);

  if (!timezone || !message) {
    return <div className="h-16" />;
  }

  return (
    <div className="text-center">
      <p className="text-lg md:text-xl text-gray-200">{message}</p>
      <p className="mt-2 text-sm text-gray-500">Detected timezone: {timezone}</p>
    </div>
  );
}
