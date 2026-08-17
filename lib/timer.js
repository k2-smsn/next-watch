import { createClient } from './supabaseClient';
import { GOAL_SECONDS } from './constants';

const supabase = createClient();

export function getDateString(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatTime(secs) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
}

export function getGoalSeconds() {
  return GOAL_SECONDS;
}

export async function fetchDaySeconds(userId, dateStr = getDateString()) {
  const { data, error } = await supabase
    .from('day_logs')
    .select('seconds')
    .eq('user_id', userId)
    .eq('log_date', dateStr)
    .maybeSingle();

  if (error) {
    console.error('fetchDaySeconds error:', JSON.stringify(error));
    return 0;
  }
  return data?.seconds ?? 0;
}

export async function saveDaySeconds(userId, seconds, dateStr = getDateString()) {
  const { error } = await supabase
    .from('day_logs')
    .upsert(
      {
        user_id: userId,
        log_date: dateStr,
        seconds,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,log_date' }
    );

  if (error) {
    console.error('saveDaySeconds error:', JSON.stringify(error));
  }
}