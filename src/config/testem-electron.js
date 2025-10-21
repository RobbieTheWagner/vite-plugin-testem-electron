/**
 * Testem configuration for Electron testing with vite-plugin-testem-electron
 * This is a template configuration that can be used as-is or customized
 */
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
