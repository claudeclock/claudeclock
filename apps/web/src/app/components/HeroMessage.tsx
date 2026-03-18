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

const APAC_HIGH_OFFSET_PREFIXES = [
  'Asia/', 'Australia/', 'Pacific/Auckland', 'Pacific/Chatham', 'Pacific/Fiji', 'Pacific/Tongatapu',
];

function getTimezoneInfo(tz: string): { region: string | null; isApac: boolean } {
  const region = APAC_TIMEZONE_MAP[tz] ?? null;
  const isApac = region !== null || APAC_HIGH_OFFSET_PREFIXES.some(p => tz.startsWith(p));
  return { region, isApac };
}

export default function HeroMessage() {
  const [info, setInfo] = useState<{ region: string | null; isApac: boolean; tz: string } | null>(null);

  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setInfo({ ...getTimezoneInfo(tz), tz });
  }, []);

  if (!info) return <div className="h-6" />;

  if (info.region) {
    return (
      <p className="text-green-400 text-sm font-medium tracking-wide">
        You&apos;re in {info.region} &mdash; your working day IS the bonus window
      </p>
    );
  }

  if (info.isApac) {
    return (
      <p className="text-green-400 text-sm font-medium tracking-wide">
        You&apos;re in the APAC region &mdash; most of your working day is the bonus window
      </p>
    );
  }

  return (
    <p className="text-gray-400 text-sm">
      Showing times in your local timezone ({info.tz})
    </p>
  );
}
