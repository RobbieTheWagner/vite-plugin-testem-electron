/**
 * Vite plugin for testem electron integration
 * Injects testem support scripts into test HTML files
 */
export default function viteTestemElectron(options = {}) {
  const { testPattern = '/tests/', baseHref = '..' } = options;

  return {
    name: 'vite-testem-electron',
    transformIndexHtml: {
      order: 'pre',
      handler(html, ctx) {
        // Only transform test HTML files
        if (ctx.path.includes(testPattern)) {
          return injectTestemSupport(html, { baseHref });
        }
        return html;
      },
    },
  };
}

/**
 * Inject testem support scripts into HTML
 * @param {string} html - Original HTML content
 * @param {object} options - Injection options
 * @returns {string} Modified HTML with testem support
 */
function injectTestemSupport(html, options = {}) {
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
