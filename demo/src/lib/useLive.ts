import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

function subscribeReducedMotion(listener: () => void): () => void {
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener('change', listener);
  return () => query.removeEventListener('change', listener);
}

/** True while the visitor asks for reduced motion. */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false
  );
}

/**
 * The on/off state of a live data feed. It starts on, unless the visitor asks
 * for reduced motion; their own choice on the switch then wins either way.
 */
export function useLiveToggle(): [boolean, (live: boolean) => void] {
  const reducedMotion = useReducedMotion();
  const [choice, setChoice] = useState<boolean | null>(null);
  const setLive = useCallback((live: boolean) => setChoice(live), []);
  return [choice ?? !reducedMotion, setLive];
}

/**
 * Calls `tick` every `intervalMs` while `enabled` and the tab is visible.
 * A hidden tab stops the feed instead of queueing updates nobody sees.
 */
export function useTicker(tick: () => void, intervalMs: number, enabled: boolean): void {
  useEffect(() => {
    if (!enabled) {
      return undefined;
    }
    let timer: number | undefined;
    const start = () => {
      window.clearInterval(timer);
      timer = document.hidden ? undefined : window.setInterval(tick, intervalMs);
    };
    start();
    document.addEventListener('visibilitychange', start);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', start);
    };
  }, [tick, intervalMs, enabled]);
}
