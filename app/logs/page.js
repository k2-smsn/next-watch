'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTimer } from '../../context/timerContext';
import { formatTime } from '../../lib/timer';
import { allDaysFiltered, formatDate } from '../../lib/streak';

export default function LogsPage() {
  const { allDays, loading } = useTimer();
  const [filter, setFilter] = useState('all');

  if (loading) {
    return (
      <div className="logs-panel">
        <p>Loading...</p>
      </div>
    );
  }

  const days = allDaysFiltered(allDays, filter).filter(d => d.seconds > 0 || d.isToday);

  return (
    <div className="logs-panel">
      <div className="logs-header">
        <Link href="/" className="btn-back">← Back</Link>
        <h2 className="logs-title">All Logs</h2>
      </div>

      <div className="logs-filters">
        <button
          className={`filter-btn${filter === 'all' ? ' active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button
          className={`filter-btn${filter === 'month' ? ' active' : ''}`}
          onClick={() => setFilter('month')}
        >
          This Month
        </button>
        <button
          className={`filter-btn${filter === 'week' ? ' active' : ''}`}
          onClick={() => setFilter('week')}
        >
          This Week
        </button>
      </div>

      <ul className="history-list">
        {days.length === 0 ? (
          <li><span className="empty-history">No sessions recorded yet.</span></li>
        ) : (
          days.map(day => (
            <li key={day.date.toISOString()}>
              <span className="history-date">{formatDate(day.date, day.isToday)}</span>
              <span className="history-time">{formatTime(day.seconds)}</span>
              <span className={`history-badge ${day.goalMet ? 'goal' : 'no-goal'}`}>
                {day.goalMet ? '✓ Goal' : (day.isToday ? 'In progress' : 'Incomplete')}
              </span>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}