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

  useEffect(() => {
    if (!notify) return;
    if (prevBonusActive.current !== status.bonusActive) {
      if (status.bonusActive) {
        sendNotification('Claude Clock', '2\u00D7 bonus window is now active!');
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
        <Text bold>{'\u26A1'} CLAUDE CLOCK</Text>
        <Text> </Text>
        <Text dimColor>No active promotion</Text>
        <Text dimColor>q to quit {'\u00B7'} claudeclock.com</Text>
      </Box>
    );
  }

  return (
    <Box borderStyle="double" flexDirection="column" paddingX={2} paddingY={1}>
      <Text bold>{'\u26A1'} CLAUDE CLOCK</Text>
      <Text> </Text>

      {status.bonusActive ? (
        <>
          <Text color="green" bold>{status.multiplier}{'\u00D7'} BONUS ACTIVE</Text>
          <Text> </Text>
          <ProgressBar progress={status.bonusProgress} />
          <Text> </Text>
          {status.windowEndLocal && (
            <>
              <Text>Ends:      <Text bold>{formatLocalTime(status.windowEndLocal)}</Text></Text>
              <Text>Remaining: <Text bold>{formatDuration(status.minutesRemaining)}</Text></Text>
            </>
          )}
        </>
      ) : (
        <>
          <Text color="yellow" bold>{'\uD83D\uDE34'} PEAK HOURS (1{'\u00D7'})</Text>
          <Text> </Text>
          {status.nextBonusStartLocal && (
            <>
              <Text>{status.multiplier}{'\u00D7'} in:     <Text bold>{formatDuration(status.minutesUntilBonus)}</Text></Text>
              <Text>Resumes: <Text bold>{formatLocalTime(status.nextBonusStartLocal)}</Text></Text>
            </>
          )}
        </>
      )}

      <Text> </Text>
      {status.promo && (
        <Text dimColor>{status.promo.name} {'\u2014'} ends {status.promoEndDate?.toLocaleDateString()}</Text>
      )}
      <Text dimColor>q to quit {'\u00B7'} claudeclock.com</Text>
    </Box>
  );
}
