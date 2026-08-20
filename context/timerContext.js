'use client';

import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { createClient } from '../lib/supabase/browserClient';
import { fetchDaySeconds, saveDaySeconds, getGoalSeconds } from '../lib/timer';
import { fetchAllDays, computeCurrentStreak, computeLongestStreak } from '../lib/streak';

const TimerContext = createContext(null);

export function TimerProvider({ children }) {
  const [userId, setUserId] = useState(null);
  const [accumulatedSeconds, setAccumulatedSeconds] = useState(0);
  const [displaySeconds, setDisplaySeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(true);

  const [allDays, setAllDays] = useState([]);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);

  const startTimestampRef = useRef(null);
  const intervalRef = useRef(null);

  const refreshHistory = useCallback(async (uid) => {
    if (!uid) return;
    const days = await fetchAllDays(uid);
    setAllDays(days);
    setCurrentStreak(computeCurrentStreak(days));
    setLongestStreak(computeLongestStreak(days));
  }, []);

  // Get the logged-in user, and re-run this whole load whenever auth state changes
  useEffect(() => {
    const supabase = createClient();
    let currentUserId = null;

    async function loadForUser(uid) {
      setLoading(true);
      if (!uid) {
        setAccumulatedSeconds(0);
        setDisplaySeconds(0);
        setAllDays([]);
        setCurrentStreak(0);
        setLongestStreak(0);
        setLoading(false);
        return;
      }
      const seconds = await fetchDaySeconds(uid);
      setAccumulatedSeconds(seconds);
      setDisplaySeconds(seconds);
      await refreshHistory(uid);
      setLoading(false);
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      const uid = session?.user?.id ?? null;
      currentUserId = uid;
      setUserId(uid);
      loadForUser(uid);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const uid = session?.user?.id ?? null;

      if (uid === currentUserId) return; //handle auto token refresh bug

      currentUserId = uid;
      setUserId(uid);
      loadForUser(uid);
    });

    return () => listener.subscription.unsubscribe();
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  const start = useCallback(async () => {
    if (running || !userId) return;
    startTimestampRef.current = Date.now();
    setRunning(true);
    await saveDaySeconds(userId, accumulatedSeconds);
  }, [running, accumulatedSeconds, userId]);

  const stop = useCallback(async () => {
    if (!running || !userId) return;
    const elapsed = Math.floor((Date.now() - startTimestampRef.current) / 1000);
    const finalSeconds = accumulatedSeconds + elapsed;

    setRunning(false);
    setAccumulatedSeconds(finalSeconds);
    setDisplaySeconds(finalSeconds);
    startTimestampRef.current = null;

    await saveDaySeconds(userId, finalSeconds);
    await refreshHistory(userId);
  }, [running, accumulatedSeconds, userId, refreshHistory]);

  const reset = useCallback(async () => {
    if (!userId) return;
    if (running) {
      clearInterval(intervalRef.current);
      setRunning(false);
      startTimestampRef.current = null;
    }
    setAccumulatedSeconds(0);
    setDisplaySeconds(0);
    await saveDaySeconds(userId, 0);
    await refreshHistory(userId);
  }, [running, userId, refreshHistory]);

  useEffect(() => {
    const saveOnHide = () => {
      if (!running || !userId) return;
      const elapsed = Math.floor((Date.now() - startTimestampRef.current) / 1000);
      const finalSeconds = accumulatedSeconds + elapsed;
      saveDaySeconds(userId, finalSeconds);
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
  }, [running, accumulatedSeconds, userId]);

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
  };

  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>;
}

export function useTimer() {
  const ctx = useContext(TimerContext);
  if (!ctx) throw new Error('useTimer must be used within a TimerProvider');
  return ctx;
}