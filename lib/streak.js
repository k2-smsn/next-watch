import { createClient } from './supabase/browserClient';
import { GOAL_SECONDS } from './constants';
import { getDateString } from './timer';

const supabase = createClient();

export async function fetchAllDays(userId) {
  const { data, error } = await supabase
    .from('day_logs')
    .select('log_date, seconds')
    .eq('user_id', userId)
    .order('log_date', { ascending: true });

  if (error) {
    console.error('fetchAllDays error:', JSON.stringify(error));
    return [];
  }

  return data.map(row => ({
    date: parseDateString(row.log_date),
    seconds: row.seconds || 0,
  }));
}

// 'YYYY-MM-DD' -> local Date at midnight (avoids UTC shift from `new Date(str)`)
function parseDateString(str) {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function metGoal(entry) {
  return !!entry && entry.seconds >= GOAL_SECONDS;
}

function findEntry(days, date) {
  const target = getDateString(date);
  return days.find(d => getDateString(d.date) === target) || null;
}

// Current streak: consecutive past days + today if goal met
export function computeCurrentStreak(days) {
  const today = new Date();
  let streak = 0;

  const todayEntry = findEntry(days, today);
  const todayMet = metGoal(todayEntry);

  let d = new Date(today);
  d.setDate(d.getDate() - 1);

  while (true) {
    const entry = findEntry(days, d);
    if (metGoal(entry)) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }

  if (todayMet) streak++;
  return streak;
}

// Longest streak ever recorded
export function computeLongestStreak(days) {
  if (days.length === 0) return 0;

  const sorted = [...days].sort((a, b) => a.date - b.date);

  let longest = 0;
  let current = 0;
  let prevDate = null;

  for (const entry of sorted) {
    if (metGoal(entry)) {
      if (prevDate) {
        const diff = (entry.date - prevDate) / (1000 * 60 * 60 * 24);
        current = diff === 1 ? current + 1 : 1;
      } else {
        current = 1;
      }
      longest = Math.max(longest, current);
      prevDate = entry.date;
    } else {
      current = 0;
      prevDate = null;
    }
  }

  return longest;
}

// Last N days (most recent first), always including today even if unlogged
export function recentDays(days, n = 7) {
  const results = [];
  const today = new Date();

  for (let i = 0; i < n; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const entry = findEntry(days, d);

    if (entry || i === 0) {
      results.push({
        date: d,
        seconds: entry ? entry.seconds : 0,
        goalMet: metGoal(entry),
        isToday: i === 0,
      });
    }
  }
  return results;
}

// All logged days, filtered by period: 'week' | 'month' | 'all'
export function allDaysFiltered(days, filter = 'all') {
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  let cutoff = null;
  if (filter === 'week') {
    cutoff = new Date(today);
    cutoff.setDate(today.getDate() - 6);
    cutoff.setHours(0, 0, 0, 0);
  } else if (filter === 'month') {
    cutoff = new Date(today.getFullYear(), today.getMonth(), 1);
  }

  const todayDate = new Date();

  return days
    .map(entry => ({
      date: entry.date,
      seconds: entry.seconds,
      goalMet: metGoal(entry),
      isToday: entry.date.toDateString() === todayDate.toDateString(),
    }))
    .filter(d => (cutoff ? d.date >= cutoff && d.date <= today : true))
    .sort((a, b) => b.date - a.date);
}

export function formatDate(date, isToday) {
  if (isToday) return 'Today';
  const options = { weekday: 'short', month: 'short', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
}