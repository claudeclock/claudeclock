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
        <Text>&#x23F8; No active Claude promotion</Text>
        <Text dimColor>Check claudeclock.com for updates</Text>
      </Box>
    );
  }

  if (status.bonusActive) {
    return (
      <Box flexDirection="column">
        <Text color="green" bold>
          &#x26A1; BONUS ACTIVE &mdash; {status.multiplier}x usage for {formatDuration(status.minutesRemaining)}
        </Text>
        {status.windowEndLocal && (
          <Text dimColor>Bonus ends at {formatLocalTime(status.windowEndLocal)}</Text>
        )}
        {status.promoEndDate && (
          <Text dimColor>Promo ends {status.promoEndDate.toLocaleDateString()}</Text>
        )}
      </Box>
    );
  }

  // Peak hours (standard rate), not bonus
  return (
    <Box flexDirection="column">
      <Text color="yellow">
        &#x1F4A4; Standard rate &mdash; bonus resumes in {formatDuration(status.minutesUntilBonus)}
      </Text>
      {status.nextBonusStartLocal && (
        <Text dimColor>Next bonus at {formatLocalTime(status.nextBonusStartLocal)}</Text>
      )}
    </Box>
  );
}
