import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { BrowserWindow, session, protocol, net } from 'electron';

// These are the command-line arguments passed to us by test-runner.js
const [, , , testPageURL, testemURL, testemId] = process.argv;

/**
 * Set up communication with the testem server
 * Intercepts requests to 'testemserver' and redirects them to the actual testem server
 */
export function setupTestem(): void {
  if (!testemURL) {
    console.log(
      'vite-plugin-testem-electron: No testem URL provided, running in standalone mode'
    );
    return;
  }

  const { host: testemHost } = new URL(testemURL);

  session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
    const urlObj = new URL(details.url);
    const { hostname } = urlObj;

    if (hostname === 'testemserver') {
      urlObj.host = testemHost;
      callback({ redirectURL: urlObj.toString() });
    } else {
      callback({});
    }
  });
}

export interface TestWindowOptions {
  width?: number;
  height?: number;
  show?: boolean;
  preloadPath?: string;
}

/**
 * Open the test window
 */
export function openTestWindow(emberAppDir: string, options: TestWindowOptions = {}): BrowserWindow {
  const {
    width = 1200,
    height = 800,
    show = !process.env.CI,
    preloadPath = path.join(process.cwd(), '.vite', 'build', 'preload.js'),
  } = options;

  const window = new BrowserWindow({
    width,
    height,
    show,
    webPreferences: {
      backgroundThrottling: false,
      contextIsolation: true,
      nodeIntegration: false,
      preload: preloadPath,
    },
  });

  delete (window as any).module;

  // Convert the emberAppDir to a file URL and append a '/' so when it's joined
  // with the testPageURL the last path component isn't dropped
  const url = new URL(
    testPageURL || 'tests/index.html?hidepassed',
    `${pathToFileURL(emberAppDir)}/`
  );

  // We need to set this query param so testem can communicate with the server
  if (testemId) {
    url.searchParams.set('testemId', testemId);
  }

  // https://github.com/nodejs/node/issues/9500
  for (const [key, value] of url.searchParams.entries()) {
    if ([null, undefined, ''].includes(value as any)) {
      url.searchParams.set(key, 'true');
    }
  }

  console.log(
    'vite-plugin-testem-electron: Loading test page:',
    url.toString()
  );
  window.loadURL(url.toString());

  return window;
}

/**
 * Handle file URLs for asset loading
 */
export function handleFileUrls(emberAppDir: string): void {
  protocol.handle('file', async ({ url }) => {
    const assetPath = await getAssetPath(emberAppDir, url);
    return net.fetch(pathToFileURL(assetPath).href, {
      bypassCustomProtocolHandlers: true,
    });
  });
}

/**
 * Get the correct asset path for file URLs
 */
async function getAssetPath(emberAppDir: string, url: string): Promise<string> {
  const { access } = await import('node:fs/promises');
  const { fileURLToPath } = await import('node:url');
  const { parse, relative, join } = await import('node:path');

  const urlPath = fileURLToPath(url);
  const { root } = parse(urlPath);
  const relPath = relative(root, urlPath);
  const appPath = join(emberAppDir, relPath);

  try {
    await access(appPath);
    return appPath;
  } catch {
    return urlPath;
  }
}
