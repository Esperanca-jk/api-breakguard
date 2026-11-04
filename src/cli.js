#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { compareSnapshots } from './compare.js';

const args = process.argv.slice(2);
const usage = 'Usage: node src/cli.js <before.json> <after.json> [--json]';
if (args.includes('--help') || args.includes('-h')) {
  console.log(usage);
} else {
  const files = args.filter(arg => !arg.startsWith('--'));
  if (files.length !== 2 || args.some(arg => arg.startsWith('--') && arg !== '--json')) {
    console.error(usage);
    process.exitCode = 2;
  } else {
    try {
      const [before, after] = await Promise.all(files.map(async file => JSON.parse(await readFile(file, 'utf8'))));
      const result = compareSnapshots(before, after);
      if (args.includes('--json')) console.log(JSON.stringify(result, null, 2));
      else {
        console.log(result.breaking ? 'Potential breaking changes detected' : 'No breaking changes found in compared samples');
        for (const change of result.changes) {
          console.log(change.severity.toUpperCase() + ' ' + change.type + ': ' + change.path +
            (change.from ? ' (' + change.from + ' -> ' + change.to + ')' : ''));
        }
      }
      process.exitCode = result.breaking ? 1 : 0;
    } catch (error) {
      console.error('Could not compare snapshots: ' + error.message);
      process.exitCode = 2;
    }
  }
}
