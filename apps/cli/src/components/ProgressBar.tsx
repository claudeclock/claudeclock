import React from 'react';
import { Text } from 'ink';

interface ProgressBarProps {
  progress: number; // 0-1
  width?: number;
}

export function ProgressBar({ progress, width = 20 }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(1, progress));
  const filled = Math.round(clamped * width);
  const empty = width - filled;
  const percent = Math.round(clamped * 100);

  return (
    <Text>
      <Text color="green">{'▓'.repeat(filled)}</Text>
      <Text dimColor>{'░'.repeat(empty)}</Text>
      <Text> {percent}%</Text>
    </Text>
  );
}
