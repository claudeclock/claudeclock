'use client';

import { useEffect, useState } from 'react';

const APAC_ZONES: Record<string, string> = {
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
};

export function useTimezone() {
  const [info, setInfo] = useState<{ region: string | null; tz: string } | null>(null);

  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setInfo({ region: APAC_ZONES[tz] ?? null, tz });
  }, []);

  return info;
}

export default function HeroMessage() {
  const info = useTimezone();
  if (!info) return null;

  if (info.region) {
    return (
      <span className="text-green-400">
        in {info.region}
      </span>
    );
  }

  return (
    <span className="text-gray-400">
      in your timezone
    </span>
  );
}
