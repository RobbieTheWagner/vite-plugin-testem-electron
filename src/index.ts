export interface ViteTestemElectronOptions {
  testPattern?: string;
  baseHref?: string;
}

export interface TransformContext {
  path: string;
}

/**
 * Check if the npm/pnpm script contains testem with testem-electron.cjs
 */
function isTestemElectronActive(): boolean {
  const script = process.env.npm_lifecycle_script;

  return !!(
    script &&
    script.includes('testem') &&
    script.includes('-f') &&
    script.includes('testem-electron')
  );
}

/**
 * Vite plugin for testem electron integration
 * Injects testem support scripts into test HTML files
 */
export default function viteTestemElectron(
  options: ViteTestemElectronOptions = {}
) {
  const { testPattern = '/tests/', baseHref = '..' } = options;

  const isActive = isTestemElectronActive();

  return {
    name: 'vite-testem-electron',
    transformIndexHtml: {
      order: 'pre' as const,
      handler(html: string, ctx: TransformContext): string {
        // Only transform if plugin is active and processing test HTML files
        if (isActive && ctx.path.includes(testPattern)) {
          return injectTestemSupport(html, { baseHref });
        }
        return html;
      },
    },
  };
}

interface InjectOptions {
  baseHref?: string;
}

/**
 * Inject testem support scripts into HTML
 */
function injectTestemSupport(
  html: string,
  options: InjectOptions = {}
): string {
  const { baseHref = '..' } = options;

  // Find insertion points
  const headCloseIndex = html.indexOf('</head>');
  const bodyCloseIndex = html.indexOf('</body>');

  if (headCloseIndex === -1 || bodyCloseIndex === -1) {
    console.warn(
      'vite-plugin-testem-electron: Could not find </head> or </body> tags'
    );
    return html;
  }

  // Inject testem support scripts
  const getTestemIdScript = `
    <script>
      // testem looks for a function called getTestemId, and if present, uses it to
      // determine the ID of this test run so it can communicate back to the testem
      // server -- see https://github.com/testem/testem/commit/4a51acc2fc0c3a23273fea838fd166b4691c2300.
      //
      // The testemId query param is added to the test URL by test-runner.js.
      //
      window.getTestemId = function () {
        let match = window.location.search.match(/[?&]testemId=([^?&]+)/);
        return match ? match[1] : null;
      };
    </script>
    <base href="${baseHref}">`;

  const testemServerScript = `
    <!-- ember-electron testem integration: load testem.js over HTTP for proper communication -->
    <script src="http://testemserver/testem.js"></script>`;

  // Insert before closing tags
  return (
    html.slice(0, headCloseIndex) +
    getTestemIdScript +
    html.slice(headCloseIndex, bodyCloseIndex) +
    testemServerScript +
    html.slice(bodyCloseIndex)
  );
}
