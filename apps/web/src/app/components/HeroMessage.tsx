'use client';

import { useEffect, useState, useRef } from 'react';

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

// Regions to cycle through — user's detected region leads, then these rotate
const CYCLE_REGIONS = [
  'New Zealand',
  'Australia',
  'Japan',
  'South Korea',
  'Singapore',
  'Hong Kong',
  'Southeast Asia',
  'India',
];

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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cycleRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Build the cycle list: detected region first (if APAC), then the rest
  const regions = (() => {
    if (!info) return CYCLE_REGIONS;
    if (info.region) {
      // Put user's region first, filter dupes
      const userRegion = info.region;
      // Map specific cities to their broader region for dedup
      const broadRegion =
        userRegion.includes('Sydney') || userRegion.includes('Melbourne') ||
        userRegion.includes('Brisbane') || userRegion.includes('Tasmania') ||
        userRegion.includes('Adelaide') || userRegion.includes('Perth') ||
        userRegion.includes('Darwin')
          ? 'Australia'
          : userRegion;
      const rest = CYCLE_REGIONS.filter(r => r !== broadRegion && r !== userRegion);
      return [userRegion, ...rest];
    }
    return CYCLE_REGIONS;
  })();

  useEffect(() => {
    // Start cycling after 4s on the first region
    timerRef.current = setTimeout(() => {
      cycleRef.current = setInterval(() => {
        setIsAnimating(true);
        setTimeout(() => {
          setCurrentIndex(prev => (prev + 1) % regions.length);
          setIsAnimating(false);
        }, 300);
      }, 3000);
    }, 4000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (cycleRef.current) clearInterval(cycleRef.current);
    };
  }, [regions.length]);

  if (!info) return null;

  const displayRegion = regions[currentIndex] || 'your timezone';

  return (
    <span className="relative inline-block">
      <span className="text-gray-400">in </span>
      <span
        className={`inline-block text-green-400 font-semibold transition-all duration-300 ${
          isAnimating
            ? 'opacity-0 translate-y-1'
            : 'opacity-100 translate-y-0'
        }`}
      >
        {displayRegion}
      </span>
    </span>
  );
}
