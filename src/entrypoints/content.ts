import { init } from '@/content/ui-injector';

export default defineContentScript({
  matches: ['*://*.reddit.com/*'],
  main() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  },
});
