import { spawn, type ChildProcess } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import electron from 'electron';
import treeKill from 'tree-kill';

// Get __filename and __dirname in ESM
const __filename = fileURLToPath(import.meta.url);

export interface TestemLauncherConfig {
  exe: string;
  args: string[];
  protocol: string;
}

/**
 * Testem launcher configuration for Electron
 * This script does double-duty:
 * 1. Exports testem launcher config
 * 2. Can be run directly to spawn electron process
 */
const config: TestemLauncherConfig = {
  exe: process.execPath,
  args: [__filename, '<testPage>', '<baseUrl>', '<id>'],
  protocol: 'browser',
};

export default config;

/**
 * Main function to spawn electron process with test arguments
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);

  // Extract Electron flags (anything starting with -- that comes before the first non-flag arg)
  const electronFlags: string[] = [];
  let testArgsStartIndex = -1;

  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      electronFlags.push(args[i]);
    } else {
      testArgsStartIndex = i;
      break;
    }
  }

  if (testArgsStartIndex === -1 || args.length < testArgsStartIndex + 3) {
    throw new Error('Missing required arguments: testPageUrl, testemUrl, testemId');
  }

  const testPageUrl = args[testArgsStartIndex];
  const testemUrl = args[testArgsStartIndex + 1];
  const testemId = args[testArgsStartIndex + 2];

  // Default electron test main path (can be overridden)
  const electronTestMain =
    process.env.ELECTRON_TEST_MAIN ||
    path.join(process.cwd(), 'electron-app', 'tests', 'index.ts');

  const electronArgs = [
    ...electronFlags, // Insert Electron flags first
    electronTestMain,
    '--', // needed because https://github.com/electron/electron/pull/13039
    testPageUrl,
    testemUrl,
    testemId,
  ];

  console.log(
    'vite-plugin-testem-electron: Starting electron with args:',
    electronArgs
  );

  const electronProcess: ChildProcess = spawn(electron as any, electronArgs, {
    stdio: 'inherit',
    cwd: process.cwd(),
  });

  // Clean up when we're killed
  process.on('SIGTERM', () => {
    if (electronProcess.pid) {
      treeKill(electronProcess.pid);
    }
  });

  process.on('SIGINT', () => {
    if (electronProcess.pid) {
      treeKill(electronProcess.pid);
    }
  });

  electronProcess.on('exit', (code) => {
    process.exit(code || 0);
  });
}

// Check if this script is being run directly
if (import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main();
}
