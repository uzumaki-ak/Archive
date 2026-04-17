import { useEffect, useState } from 'react';

/**
 * Debounces a value by the specified delay.
 * Used in SearchScreen to avoid firing an API call on every keystroke.
 *
 * @param value - The value to debounce
 * @param delay - Delay in ms (default: 400ms — responsive but not spammy)
 */
export function useDebounce<T>(value: T, delay = 400): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
