#!/usr/bin/env node
import React from 'react';
import { render } from 'ink';
import meow from 'meow';
import { loadConfig } from './config.js';
import { getPromoStatus } from './promo.js';
import { QuickStatus } from './components/QuickStatus.js';

const cli = meow(
  `
  Usage
    $ claudeclock

  Options
    --json        Machine-readable JSON output

  Examples
    $ claudeclock
    $ claudeclock --json
`,
  {
    importMeta: import.meta,
    flags: {
      json: {
        type: 'boolean',
        default: false,
      },
    },
  },
);

async function main() {
  const config = await loadConfig();
  const status = getPromoStatus(config);

  if (cli.flags.json) {
    console.log(JSON.stringify(status, null, 2));
    process.exit(0);
  }

  // Quick-check mode: render once and exit
  const { unmount, waitUntilExit } = render(<QuickStatus status={status} />);
  unmount();
  await waitUntilExit();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
