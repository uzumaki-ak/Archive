/**
 * useAppState Hook
 * Tracks app lifecycle (active, background, inactive) and exposes
 * a callback for when the app returns to foreground (active).
 *
 * Usage:
 *   useAppState({ onForeground: () => dispatch(loadBooks()) });
 */

import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { logger } from '../utils/logger';

interface UseAppStateOptions {
  onForeground?: () => void;
  onBackground?: () => void;
}

export function useAppState({
  onForeground,
  onBackground,
}: UseAppStateOptions = {}): void {
  const appState = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      (nextState: AppStateStatus) => {
        const previous = appState.current;
        appState.current = nextState;

        logger.info(
          'AppState',
          `Transition: ${previous} → ${nextState}`,
        );

        if (nextState === 'active' && previous !== 'active') {
          // App came to foreground from background or inactive
          onForeground?.();
        }

        if (nextState === 'background' && previous === 'active') {
          // App moved to background
          onBackground?.();
        }
      },
    );

    return () => subscription.remove();
  }, [onForeground, onBackground]);
}
