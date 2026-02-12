import { useState, useCallback, useRef, useEffect } from 'react';

interface RateLimiterOptions {
  maxAttempts: number;
  cooldownMs: number;
}

export function useRateLimiter({ maxAttempts = 3, cooldownMs = 30000 }: RateLimiterOptions) {
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  const clearTimers = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  const recordAttempt = useCallback(() => {
    setAttempts((prev) => {
      const newAttempts = prev + 1;
      
      if (newAttempts >= maxAttempts) {
        setIsLocked(true);
        setRemainingTime(Math.ceil(cooldownMs / 1000));
        
        // Start countdown
        countdownRef.current = setInterval(() => {
          setRemainingTime((t) => {
            if (t <= 1) {
              clearTimers();
              setIsLocked(false);
              setAttempts(0);
              return 0;
            }
            return t - 1;
          });
        }, 1000);
      }
      
      return newAttempts;
    });
  }, [maxAttempts, cooldownMs, clearTimers]);

  const reset = useCallback(() => {
    clearTimers();
    setAttempts(0);
    setIsLocked(false);
    setRemainingTime(0);
  }, [clearTimers]);

  return {
    attempts,
    isLocked,
    remainingTime,
    recordAttempt,
    reset,
    attemptsRemaining: Math.max(0, maxAttempts - attempts),
  };
}
