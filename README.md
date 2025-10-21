# vite-plugin-testem-electron

A Vite plugin that provides testem electron integration without requiring the full ember-electron addon.

## Features

- 🎯 **Framework agnostic** - Works with any Vite-based project
- ⚡ **Zero config** - Sensible defaults, works out of the box
- 🔧 **Minimal setup** - Just add the plugin and run tests
- 📦 **Lightweight** - Single dependency (`tree-kill`)
- 🚀 **Drop-in replacement** - For manual ember-electron testem setups

## Installation

```bash
npm install --save-dev vite-plugin-testem-electron tree-kill
```

## Usage

### 1. Configure Vite

Add the plugin to your `vite.config.js`:

```javascript
import { defineConfig } from 'vite';
import viteTestemElectron from 'vite-plugin-testem-electron';

export default defineConfig({
  plugins: [
    viteTestemElectron({
      // Optional configuration
      testPattern: '/tests/', // Only transform HTML files matching this pattern
      baseHref: '..', // Base href for asset loading in tests
    }),
  ],
});
```

### 2. Create Testem Configuration

Create a `testem-electron.js` file:

```javascript
import config from 'vite-plugin-testem-electron/config/testem-electron';

export default config;
```

Or create a custom configuration:

```javascript
export default {
  test_page: 'tests/index.html?hidepassed',
  cwd: 'dist',
  disable_watching: true,
  launchers: {
    Electron: {
      exe: process.execPath,
      args: [
        './node_modules/vite-plugin-testem-electron/src/test-runner.js',
        '<testPage>',
        '<baseUrl>',
        '<id>',
      ],
      protocol: 'browser',
    },
  },
  launch_in_ci: ['Electron'],
  launch_in_dev: ['Electron'],
  browser_start_timeout: 120,
};
```

### 3. Set up Electron Main Process

In your electron test main file (e.g., `electron-app/tests/index.js`):

```javascript
import { resolve } from 'node:path';
import { app } from 'electron';
import {
  handleFileUrls,
  openTestWindow,
  setupTestem,
} from 'vite-plugin-testem-electron/electron';

const emberAppDir = resolve(__dirname, '..', '..', 'dist');

app.on('ready', async () => {
  // Set test mode
  process.env.ELECTRON_IS_TESTING = 'true';

  // Handle file URLs for asset loading
  await handleFileUrls(emberAppDir);

  // Set up testem communication
  setupTestem();

  // Open the test window - testem.js will handle QUnit integration automatically
  openTestWindow(emberAppDir);
});

app.on('window-all-closed', () => {
  app.quit();
});
```

### 4. Add Package Script

Add a test script to your `package.json`:

```json
{
  "scripts": {
    "test:electron": "vite build --mode development && testem ci -f testem-electron.js"
  }
}
```

### 5. Run Tests

```bash
npm run test:electron
```

## How It Works

The plugin automatically injects the necessary testem integration scripts into your test HTML:

1. **`window.getTestemId` function** - Required for testem to identify test runs
2. **`<base href="..">` tag** - Fixes asset loading paths in test mode
3. **`http://testemserver/testem.js` script** - Loads testem client over HTTP for proper communication

The electron helpers set up request interception to redirect `testemserver` requests to the actual testem server URL.

## Configuration Options

### Plugin Options

- `testPattern` (string, default: `'/tests/'`) - Only transform HTML files containing this pattern
- `baseHref` (string, default: `'..'`) - Base href value for asset loading

### Environment Variables

- `ELECTRON_TEST_MAIN` - Override the default electron test main path

## API

### Electron Helpers

#### `setupTestem()`

Sets up request interception to redirect testemserver requests to the actual testem server.

#### `openTestWindow(emberAppDir, options?)`

Creates and opens the electron test window.

**Parameters:**

- `emberAppDir` (string) - Path to the built app directory
- `options` (object, optional):
  - `width` (number, default: 1200) - Window width
  - `height` (number, default: 800) - Window height
  - `show` (boolean, default: !process.env.CI) - Whether to show the window
  - `preloadPath` (string) - Path to preload script

#### `handleFileUrls(emberAppDir)`

Sets up file URL handling for asset loading.

**Parameters:**

- `emberAppDir` (string) - Path to the built app directory

## Requirements

- Node.js >= 16
- Vite >= 3.0.0
- Electron >= 10.0.0

## License

MIT
