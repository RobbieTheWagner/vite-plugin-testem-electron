/**
 * Integration tests for vite-plugin-testem-electron
 * Tests the HTML transformation functionality
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import viteTestemElectron from '../src/index.js';

// Test HTML that resembles a test page
const testHtml = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Test Page</title>
  </head>
  <body>
    <div id="qunit"></div>
    <script src="/testem.js"></script>
  </body>
</html>`;

describe('vite-plugin-testem-electron', () => {
  let originalScript;

  beforeEach(() => {
    originalScript = process.env.npm_lifecycle_script;
    // Mock npm script with testem-electron.cjs
    process.env.npm_lifecycle_script = 'vite build && testem ci -f testem-electron.cjs';
  });

  afterEach(() => {
    if (originalScript) {
      process.env.npm_lifecycle_script = originalScript;
    } else {
      delete process.env.npm_lifecycle_script;
    }
  });

  it('should transform test HTML with default options', () => {
    const plugin = viteTestemElectron();
    const testContext = { path: '/tests/index.html' };
    const transformFn = plugin.transformIndexHtml.handler;

    const transformedHtml = transformFn(testHtml, testContext);

    expect(transformedHtml).toContain('window.getTestemId');
    expect(transformedHtml).toContain('<base href=');
    expect(transformedHtml).toContain('http://testemserver/testem.js');
  });

  it('should not transform non-test HTML', () => {
    const plugin = viteTestemElectron();
    const nonTestContext = { path: '/index.html' };
    const transformFn = plugin.transformIndexHtml.handler;

    const nonTransformedHtml = transformFn(testHtml, nonTestContext);

    expect(nonTransformedHtml).toBe(testHtml);
  });

  it('should use custom configuration options', () => {
    const customPlugin = viteTestemElectron({ baseHref: '../custom' });
    const testContext = { path: '/tests/index.html' };
    const customTransformFn = customPlugin.transformIndexHtml.handler;

    const customTransformed = customTransformFn(testHtml, testContext);

    expect(customTransformed).toContain('href="../custom"');
  });

  it('should be noop when testem-electron.cjs is not in script', () => {
    // Override script to not include testem-electron.cjs
    process.env.npm_lifecycle_script = 'vite build && testem ci -f regular-testem.json';
    
    const plugin = viteTestemElectron();
    const testContext = { path: '/tests/index.html' };
    const transformFn = plugin.transformIndexHtml.handler;

    const result = transformFn(testHtml, testContext);

    // Should return unchanged HTML since plugin is inactive
    expect(result).toBe(testHtml);
  });

  it('should work with different testem-electron.cjs path formats', () => {
    // Test with full path
    process.env.npm_lifecycle_script = 'vite build && testem ci -f ./config/testem-electron.cjs';
    
    const plugin = viteTestemElectron();
    const testContext = { path: '/tests/index.html' };
    const transformFn = plugin.transformIndexHtml.handler;

    const result = transformFn(testHtml, testContext);

    // Should transform since it includes testem-electron.cjs
    expect(result).toContain('window.getTestemId');
  });

  it('should work with the exact user command pattern', () => {
    // Test the exact pattern: vite build -c vite.renderer.config.ts --mode development && testem ci -f testem-electron.cjs
    process.env.npm_lifecycle_script = 'vite build -c vite.renderer.config.ts --mode development && testem ci -f testem-electron.cjs';
    
    const plugin = viteTestemElectron();
    const testContext = { path: '/tests/index.html' };
    const transformFn = plugin.transformIndexHtml.handler;

    const result = transformFn(testHtml, testContext);

    // Should transform since script contains testem with testem-electron.cjs
    expect(result).toContain('window.getTestemId');
    expect(result).toContain('http://testemserver/testem.js');
  });
});