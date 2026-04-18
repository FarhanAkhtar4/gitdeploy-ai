'use client';

import { useSyncExternalStore } from 'react';

/**
 * SSR-safe hook to detect if the component is mounted on the client.
 * Returns `false` during SSR/hydration, `true` after mount.
 *
 * Uses useSyncExternalStore with getServerSnapshot=false to avoid
 * hydration mismatches and setState-in-effect lint errors.
 */
const emptySubscribe = () => () => {};

export function useMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}
