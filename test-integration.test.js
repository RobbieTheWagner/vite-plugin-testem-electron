/**
 * Integration tests for vite-plugin-testem-electron
 * Tests the HTML transformation functionality
 */
import { describe, it, expect } from 'vitest';
import viteTestemElectron from './src/index.js';

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
  it('should transform test HTML with default options', () => {
    const plugin = viteTestemElectron();
    const testContext = { path: '/tests/index.html' };
    const transformFn = plugin.transformIndexHtml.transform;
    
    const transformedHtml = transformFn(testHtml, testContext);
    
    expect(transformedHtml).toContain('window.getTestemId');
    expect(transformedHtml).toContain('<base href=');
    expect(transformedHtml).toContain('http://testemserver/testem.js');
  });

  it('should not transform non-test HTML', () => {
    const plugin = viteTestemElectron();
    const nonTestContext = { path: '/index.html' };
    const transformFn = plugin.transformIndexHtml.transform;
    
    const nonTransformedHtml = transformFn(testHtml, nonTestContext);
    
    expect(nonTransformedHtml).toBe(testHtml);
  });

  it('should use custom configuration options', () => {
    const customPlugin = viteTestemElectron({ baseHref: '../custom' });
    const testContext = { path: '/tests/index.html' };
    const customTransformFn = customPlugin.transformIndexHtml.transform;
    
    const customTransformed = customTransformFn(testHtml, testContext);
    
    expect(customTransformed).toContain('href="../custom"');
  });
});