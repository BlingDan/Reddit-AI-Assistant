import { defineConfig } from 'wxt';
import path from 'path';

export default defineConfig({
  modules: ['@wxt-dev/module-vue'],
  srcDir: 'src',
  entrypointsDir: 'entrypoints',
  vite: () => ({
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
  }),
  manifest: {
    name: 'Reddit AI Assistant',
    description: 'AI-powered summarization for Reddit posts and comment threads',
    permissions: ['storage', 'activeTab'],
    host_permissions: ['*://*.reddit.com/*'],
  },
});
