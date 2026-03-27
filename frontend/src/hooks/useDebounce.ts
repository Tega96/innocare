// frontend/src/hooks/useDebounce.js
import { useState, useEffect } from 'react';

export const useDebounce = <T>(value: T, delay: number = 500): T => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
};