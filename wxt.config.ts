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
    icons: {
      16: 'icon/icon.svg',
      32: 'icon/icon.svg',
      48: 'icon/icon.svg',
      128: 'icon/icon.svg',
    },
    action: {
      default_icon: {
        16: 'icon/icon.svg',
        32: 'icon/icon.svg',
        48: 'icon/icon.svg',
        128: 'icon/icon.svg',
      },
    },
  },
});
