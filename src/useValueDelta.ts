import { useState, useEffect, useRef } from 'react';

export function useValueDelta(value: number | undefined) {
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);
  const [delta, setDelta] = useState<number | null>(null);
  const prevValueRef = useRef<number | null>(null);

  useEffect(() => {
    if (value !== undefined && value !== null) {
      if (prevValueRef.current !== null && prevValueRef.current !== value) {
        const diff = value - prevValueRef.current;
        setDelta(diff);
        
        if (diff > 0) setFlash('up');
        else setFlash('down');

        const timer = setTimeout(() => setFlash(null), 800);
        return () => clearTimeout(timer);
      }
      prevValueRef.current = value;
    }
  }, [value]);

  return { flash, delta };
}
