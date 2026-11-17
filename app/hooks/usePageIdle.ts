'use client';

import { useEffect, useState } from 'react';

/**
 * True once the page has finished loading and the browser has a quiet moment.
 * Gate heavy, non-essential work on it so that work does not compete with the
 * first paint for bandwidth and CPU.
 */
export function usePageIdle() {
  const [idle, setIdle] = useState(false);

  useEffect(() => {
    let cancel = () => {};
    const markIdle = () => setIdle(true);
    const waitForIdle = () => {
      // Safari has no requestIdleCallback; a short pause after load is close enough.
      if ('requestIdleCallback' in window) {
        const handle = window.requestIdleCallback(markIdle, { timeout: 2000 });
        cancel = () => window.cancelIdleCallback(handle);
      } else {
        const handle = setTimeout(markIdle, 200);
        cancel = () => clearTimeout(handle);
      }
    };

    if (document.readyState === 'complete') {
      waitForIdle();
    } else {
      window.addEventListener('load', waitForIdle, { once: true });
    }
    return () => {
      window.removeEventListener('load', waitForIdle);
      cancel();
    };
  }, []);

  return idle;
}
