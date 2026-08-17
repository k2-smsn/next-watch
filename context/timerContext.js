'use client';

import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import {
  fetchDaySeconds,
  saveDaySeconds,
  getGoalSeconds,
} from '../lib/timer';
import {
  fetchAllDays,
  computeCurrentStreak,
  computeLongestStreak,
} from '../lib/streak';

const TimerContext = createContext(null);

export function TimerProvider({ children }) {
  const [accumulatedSeconds, setAccumulatedSeconds] = useState(0);
  const [displaySeconds, setDisplaySeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(true);

  const [allDays, setAllDays] = useState([]);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);

  const startTimestampRef = useRef(null);
  const intervalRef = useRef(null);

  const refreshHistory = useCallback(async () => {
    const days = await fetchAllDays();
    setAllDays(days);
    setCurrentStreak(computeCurrentStreak(days));
    setLongestStreak(computeLongestStreak(days));
  }, []);

  useEffect(() => {
    (async () => {
      const seconds = await fetchDaySeconds();
      setAccumulatedSeconds(seconds);
      setDisplaySeconds(seconds);
      await refreshHistory();
      setLoading(false);
    })();
  }, [refreshHistory]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimestampRef.current) / 1000);
        setDisplaySeconds(accumulatedSeconds + elapsed);
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const start = useCallback(async () => {
    if (running) return;
    startTimestampRef.current = Date.now();
    setRunning(true);
    await saveDaySeconds(accumulatedSeconds);
  }, [running, accumulatedSeconds]);

  const stop = useCallback(async () => {
    if (!running) return;
    const elapsed = Math.floor((Date.now() - startTimestampRef.current) / 1000);
    const finalSeconds = accumulatedSeconds + elapsed;

    setRunning(false);
    setAccumulatedSeconds(finalSeconds);
    setDisplaySeconds(finalSeconds);
    startTimestampRef.current = null;

    await saveDaySeconds(finalSeconds);
    await refreshHistory();
  }, [running, accumulatedSeconds, refreshHistory]);

  const reset = useCallback(async () => {
    if (running) {
      clearInterval(intervalRef.current);
      setRunning(false);
      startTimestampRef.current = null;
    }
    setAccumulatedSeconds(0);
    setDisplaySeconds(0);
    await saveDaySeconds(0);
    await refreshHistory();
  }, [running, refreshHistory]);

  useEffect(() => {
    const saveOnHide = () => {
      if (!running) return;
      const elapsed = Math.floor((Date.now() - startTimestampRef.current) / 1000);
      const finalSeconds = accumulatedSeconds + elapsed;
      saveDaySeconds(finalSeconds);
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') saveOnHide();
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('beforeunload', saveOnHide);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('beforeunload', saveOnHide);
    };
  }, [running, accumulatedSeconds]);

  const value = {
    seconds: displaySeconds,
    running,
    loading,
    goalSeconds: getGoalSeconds(),
    start,
    stop,
    reset,
    allDays,
    currentStreak,
    longestStreak,
    refreshHistory,
  };

  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>;
}

export function useTimer() {
  const ctx = useContext(TimerContext);
  if (!ctx) throw new Error('useTimer must be used within a TimerProvider');
  return ctx;
}