export interface TestemLauncher {
  exe: string;
  args: string[];
  protocol: string;
}

export interface TestemConfig {
  test_page: string;
  cwd: string;
  disable_watching: boolean;
  launchers: {
    [key: string]: TestemLauncher;
  };
  launch_in_ci: string[];
  launch_in_dev: string[];
  browser_start_timeout: number;
}

/**
 * Testem configuration for Electron testing with vite-plugin-testem-electron
 * This is a template configuration that can be used as-is or customized
 */
const config: TestemConfig = {
  test_page: 'tests/index.html?hidepassed',
  cwd: 'dist',
  disable_watching: true,
  launchers: {
    Electron: {
      exe: process.execPath,
      args: [
        './node_modules/vite-plugin-testem-electron/dist/test-runner.js',
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

export default config;
