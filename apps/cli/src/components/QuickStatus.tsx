import React from 'react';
import { Box, Text } from 'ink';
import type { PromoStatus } from '../promo.js';
import { formatDuration, formatLocalTime } from '../promo.js';

interface QuickStatusProps {
  status: PromoStatus;
}

export function QuickStatus({ status }: QuickStatusProps) {
  if (!status.hasActivePromo) {
    return (
      <Box flexDirection="column">
        <Text>{'\u23F8'} No active Claude promotion</Text>
        <Text dimColor>Check claudeclock.com for updates</Text>
      </Box>
    );
  }

  if (status.bonusActive) {
    return (
      <Box flexDirection="column">
        <Text color="green" bold>
          {'\u26A1'} {status.multiplier}{'\u00D7'} ACTIVE {'\u2014'} {formatDuration(status.minutesRemaining)} remaining
        </Text>
        {status.windowEndLocal && (
          <Text dimColor>Ends at {formatLocalTime(status.windowEndLocal)}</Text>
        )}
        {status.promoEndDate && (
          <Text dimColor>Promo ends {status.promoEndDate.toLocaleDateString()}</Text>
        )}
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Text color="yellow">
        {'\uD83D\uDE34'} Peak hours {'\u2014'} {status.multiplier}{'\u00D7'} resumes in {formatDuration(status.minutesUntilBonus)}
      </Text>
      {status.nextBonusStartLocal && (
        <Text dimColor>Next bonus at {formatLocalTime(status.nextBonusStartLocal)}</Text>
      )}
    </Box>
  );
}
