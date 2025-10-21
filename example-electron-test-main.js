/**
 * Example Electron test main process file
 * This shows how to integrate vite-plugin-testem-electron with your electron app
 */
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { app, ipcMain } from 'electron';
import {
  handleFileUrls,
  openTestWindow,
  setupTestem,
} from 'vite-plugin-testem-electron/electron';

// __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to your built app
const emberAppDir = resolve(__dirname, '..', '..', 'dist');

// Example IPC handlers (customize as needed)
ipcMain.handle('getAppVersion', async () => {
  return app.getVersion();
});

ipcMain.handle('getPlatform', () => {
  return process.platform;
});

app.on('ready', async function onReady() {
  // Set a global for the preload script to detect test mode
  process.env.ELECTRON_IS_TESTING = 'true';

  // Handle file URLs for asset loading
  handleFileUrls(emberAppDir);

  // Set up testem communication
  setupTestem();

  // Open the test window - testem.js will handle QUnit integration automatically
  openTestWindow(emberAppDir);
});

app.on('window-all-closed', function onWindowAllClosed() {
  app.quit();
});
