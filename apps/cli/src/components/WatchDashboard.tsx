import React, { useState, useEffect, useRef } from 'react';
import { Box, Text, useApp, useInput } from 'ink';
import process from 'node:process';
import type { PromoConfig, PromoStatus } from '../promo.js';
import { getPromoStatus, formatDuration, formatLocalTime } from '../promo.js';
import { ProgressBar } from './ProgressBar.js';
import { sendNotification } from '../notify.js';

interface WatchDashboardProps {
  config: PromoConfig;
  notify: boolean;
}

export function WatchDashboard({ config, notify }: WatchDashboardProps) {
  const { exit } = useApp();
  const [status, setStatus] = useState<PromoStatus>(() => getPromoStatus(config));
  const prevBonusActive = useRef<boolean>(status.bonusActive);

  useEffect(() => {
    const timer = setInterval(() => {
      setStatus(getPromoStatus(config));
    }, 1000);
    return () => clearInterval(timer);
  }, [config]);

  // Notification on bonus state change
  useEffect(() => {
    if (!notify) return;
    if (prevBonusActive.current !== status.bonusActive) {
      if (status.bonusActive) {
        sendNotification('Claude Clock', 'Bonus window is now ACTIVE!');
      } else {
        sendNotification('Claude Clock', 'Bonus window ended.');
      }
    }
    prevBonusActive.current = status.bonusActive;
  }, [status.bonusActive, notify]);

  useInput(
    (input) => {
      if (input === 'q') {
        exit();
      }
    },
    { isActive: process.stdin.isTTY === true },
  );

  if (!status.hasActivePromo) {
    return (
      <Box borderStyle="double" flexDirection="column" paddingX={2} paddingY={1}>
        <Text bold>&#x26A1; CLAUDE CLOCK &#x26A1;</Text>
        <Text dimColor>No active promotion</Text>
        <Text dimColor>q to quit &#xB7; claudeclock.com</Text>
      </Box>
    );
  }

  return (
    <Box borderStyle="double" flexDirection="column" paddingX={2} paddingY={1}>
      <Text bold>&#x26A1; CLAUDE CLOCK &#x26A1;</Text>
      <Text> </Text>

      {status.bonusActive ? (
        <>
          <Text color="green" bold>{status.multiplier}X BONUS ACTIVE</Text>
          <Text> </Text>
          <ProgressBar progress={status.bonusProgress} />
          <Text> </Text>
          {status.windowEndLocal && (
            <>
              <Text>Bonus ends: <Text bold>{formatLocalTime(status.windowEndLocal)}</Text></Text>
              <Text>Time left:  <Text bold>{formatDuration(status.minutesRemaining)}</Text></Text>
            </>
          )}
        </>
      ) : (
        <>
          <Text color="yellow" bold>STANDARD (1X)</Text>
          <Text> </Text>
          {status.nextBonusStartLocal && (
            <>
              <Text>Bonus in:   <Text bold>{formatDuration(status.minutesUntilBonus)}</Text></Text>
              <Text>Resumes at: <Text bold>{formatLocalTime(status.nextBonusStartLocal)}</Text></Text>
            </>
          )}
        </>
      )}

      <Text> </Text>
      {status.promo && (
        <Text dimColor>{status.promo.name} &mdash; ends {status.promoEndDate?.toLocaleDateString()}</Text>
      )}
      <Text dimColor>q to quit &#xB7; claudeclock.com</Text>
    </Box>
  );
}
