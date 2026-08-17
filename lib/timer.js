import { createClient } from './supabase/browserClient';
import { CURRENT_USER_ID, GOAL_SECONDS } from './constants';

const supabase = createClient();

// Returns 'YYYY-MM-DD' in local time (avoids UTC off-by-one issues)
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

// Fetch seconds already logged for a given date (defaults to today)
export async function fetchDaySeconds(dateStr = getDateString()) {
  const { data, error } = await supabase
    .from('day_logs')
    .select('seconds')
    .eq('user_id', CURRENT_USER_ID)
    .eq('log_date', dateStr)
    .maybeSingle();

  if (error) {
    console.error('fetchDaySeconds error:', JSON.stringify(error, null, 2));
    return 0;
  }
  return data?.seconds ?? 0;
}

// Upsert (insert or update) the seconds for a given date
export async function saveDaySeconds(seconds, dateStr = getDateString()) {
  const { error } = await supabase
    .from('day_logs')
    .upsert(
      {
        user_id: CURRENT_USER_ID,
        log_date: dateStr,
        seconds,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,log_date' }
    );

  if (error) {
    console.error('saveDaySeconds error:', error);
  }
}