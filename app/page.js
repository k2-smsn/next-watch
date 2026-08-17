'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTimer } from '../context/timerContext';
import { formatTime } from '../lib/timer';
import { recentDays, formatDate } from '../lib/streak';

export default function Home() {
  const {
    seconds, running, loading, goalSeconds,
    start, stop, reset,
    allDays, currentStreak, longestStreak,
  } = useTimer();

  const [showResetModal, setShowResetModal] = useState(false);

  if (loading) {
    return (
      <main id="mainView">
        <h1>Work Timer</h1>
        <p>Loading...</p>
      </main>
    );
  }

  const pct = Math.min((seconds / goalSeconds) * 100, 100);
  const goalMetToday = seconds >= goalSeconds;
  const last7 = recentDays(allDays, 7).filter(d => d.seconds > 0 || d.isToday);

  let streakSub;
  if (currentStreak === 0 && !goalMetToday) {
    streakSub = "Complete today's goal to build your streak.";
  } else if (goalMetToday) {
    streakSub = currentStreak === 1
      ? 'Goal reached today! Keep it up.'
      : `${currentStreak} days in a row — great consistency!`;
  } else {
    streakSub = `${currentStreak} day${currentStreak !== 1 ? 's' : ''} — reach today's goal to keep it going.`;
  }

  function handleStartStop() {
    if (running) {
      stop();
    } else {
      start();
    }
  }

  function handleConfirmReset() {
    setShowResetModal(false);
    reset();
  }

  return (
    <>
      <main id="mainView">
        <h1>Work Timer</h1>

        <section className="timer-section">
          <div className={`timer-display${running ? ' running' : ''}`}>
            {formatTime(seconds)}
          </div>
          <div className="goal-label">Goal: {formatTime(goalSeconds)}</div>
          <div className="progress-bar-wrap">
            <div
              className={`progress-bar${goalMetToday ? ' complete' : ''}`}
              style={{ width: pct + '%' }}
            />
          </div>
          <div className="progress-text">{Math.floor(pct)}% of daily goal</div>
        </section>

        <section className="controls">
          <button
            className={`btn primary${running ? ' active' : ''}`}
            onClick={handleStartStop}
          >
            {running ? 'Stop' : 'Start'}
          </button>
          <button className="btn secondary" onClick={() => setShowResetModal(true)}>
            Reset
          </button>
        </section>

        <section className="streak-section">
          <div className="streak-row">
            <div className="streak-box">
              <span className="streak-number">{currentStreak}</span>
              <span className="streak-label">day streak</span>
            </div>
            <div className="streak-divider" />
            <div className="streak-box">
              <span className="streak-number streak-number--muted">{longestStreak}</span>
              <span className="streak-label">longest streak</span>
            </div>
          </div>
          <div className="streak-sub">{streakSub}</div>
        </section>

        <section className="history-section">
          <div className="history-header">
            <h2>Recent Days</h2>
            <Link href="/logs" className="btn-link">View all logs →</Link>
          </div>
          <ul className="history-list">
            {last7.length === 0 ? (
              <li><span className="empty-history">No sessions recorded yet.</span></li>
            ) : (
              last7.map(day => (
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
        </section>
      </main>

      {showResetModal && (
        <div
          className="modal-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) setShowResetModal(false); }}
        >
          <div className="modal">
            <p className="modal-title">Reset today&apos;s timer?</p>
            <p className="modal-body">This will clear your time for today. This cannot be undone.</p>
            <div className="modal-actions">
              <button className="btn secondary" onClick={() => setShowResetModal(false)}>
                Cancel
              </button>
              <button className="btn danger" onClick={handleConfirmReset}>
                Yes, Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}