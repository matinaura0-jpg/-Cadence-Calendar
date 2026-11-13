import React, {useMemo, useState} from 'react';
import {Download, RotateCcw} from 'lucide-react';
import {getTodayDateKey} from '../data/seedData';
import {
  FocusSession,
  PROJECT_AREAS,
  ProjectArea,
  TaskItem,
  WorkspaceData,
} from '../types/productivity';

interface InsightsViewProps {
  workspace: WorkspaceData;
  onResetDemoData: () => void;
}

export const InsightsView: React.FC<InsightsViewProps> = ({
  workspace,
  onResetDemoData,
}) => {
  const [confirmReset, setConfirmReset] = useState(false);

  const stats = useMemo(() => {
    const {tasks, sessions} = workspace;
    const totalMinutes = sessions.reduce((acc, s) => acc + s.durationMinutes, 0);
    const deepMinutes = sessions
      .filter((s) => s.mode === 'deep')
      .reduce((acc, s) => acc + s.durationMinutes, 0);
    const completedTasks = tasks.filter((t) => t.completed).length;

    // Build 7-day timeline ending today
    const days: {dateKey: string; label: string; minutes: number}[] = [];
    for (let offset = -6; offset <= 0; offset++) {
      const key = getTodayDateKey(offset);
      const d = new Date();
      d.setDate(d.getDate() + offset);
      const label = d.toLocaleDateString(undefined, {weekday: 'short'});
      const dayMins = sessions
        .filter((s) => s.completedAt.slice(0, 10) === key)
        .reduce((acc, s) => acc + s.durationMinutes, 0);
      days.push({dateKey: key, label, minutes: dayMins});
    }

    // Streak calculation (consecutive days with >= 1 session going back from today or yesterday)
    let streak = 0;
    const activeDates = new Set(sessions.map((s) => s.completedAt.slice(0, 10)));
    for (let offset = 0; offset > -30; offset--) {
      const key = getTodayDateKey(offset);
      if (activeDates.has(key)) {
        streak++;
      } else if (offset === 0) {
        // Still allow streak if user hasn't logged today yet
        continue;
      } else {
        break;
      }
    }

    // Project allocation
    const byProject: Record<ProjectArea, number> = {
      'Client Work': 0,
      Engineering: 0,
      Strategy: 0,
      Operations: 0,
      Personal: 0,
    };
    for (const s of sessions) {
      byProject[s.project] = (byProject[s.project] || 0) + s.durationMinutes;
    }

    const projectBreakdown = PROJECT_AREAS.map((area) => ({
      area,
      minutes: byProject[area] || 0,
      share:
        totalMinutes > 0
          ? Math.round(((byProject[area] || 0) / totalMinutes) * 100)
          : 0,
    })).sort((a, b) => b.minutes - a.minutes);

    return {
      totalHours: (totalMinutes / 60).toFixed(1),
      deepShare:
        totalMinutes > 0 ? Math.round((deepMinutes / totalMinutes) * 100) : 0,
      completedTasks,
      totalTasks: tasks.length,
      streak,
      days,
      maxDayMinutes: Math.max(60, ...days.map((d) => d.minutes)),
      projectBreakdown,
    };
  }, [workspace]);

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(workspace, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cadence-workspace-${getTodayDateKey(0)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* 4-Column KPI Strip */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Focus Logged (7d)
          </p>
          <p className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white font-display tabular-nums">
            {stats.totalHours}h
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            {workspace.sessions.length} total sessions
          </p>
        </div>

        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Tasks Closed
          </p>
          <p className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white font-display tabular-nums">
            {stats.completedTasks}
            <span className="text-base font-normal text-slate-400">
              /{stats.totalTasks}
            </span>
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            {stats.totalTasks > 0
              ? `${Math.round((stats.completedTasks / stats.totalTasks) * 100)}% completion rate`
              : 'No tasks yet'}
          </p>
        </div>

        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Deep Work Ratio
          </p>
          <p className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white font-display tabular-nums">
            {stats.deepShare}%
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Sessions 50m+ uninterrupted
          </p>
        </div>

        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Active Focus Streak
          </p>
          <p className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white font-display tabular-nums">
            {stats.streak} {stats.streak === 1 ? 'day' : 'days'}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Consecutive focus days
          </p>
        </div>
      </section>

      {/* Main Analytics Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* 7-Day Focus Bar Chart */}
        <section className="lg:col-span-7 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white font-display">
                Daily Focus Capacity
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Minutes of deliberate execution logged over the past 7 days
              </p>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 sm:gap-4 items-end h-48 pt-4">
            {stats.days.map((day, i) => {
              const pct = Math.max(
                4,
                Math.round((day.minutes / stats.maxDayMinutes) * 100)
              );
              const isToday = i === stats.days.length - 1;
              return (
                <div
                  key={day.dateKey}
                  className="flex flex-col items-center justify-end h-full gap-2"
                >
                  <span className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
                    {day.minutes > 0 ? `${day.minutes}m` : '0'}
                  </span>
                  <div className="w-full max-w-[38px] flex-1 flex items-end">
                    <div
                      style={{height: `${day.minutes === 0 ? 4 : pct}%`}}
                      className={`w-full rounded-t-md transition-all ${
                        day.minutes === 0
                          ? 'bg-slate-100 dark:bg-slate-800'
                          : isToday
                          ? 'bg-blue-600 dark:bg-blue-500'
                          : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    />
                  </div>
                  <span
                    className={`text-xs ${
                      isToday
                        ? 'font-semibold text-blue-600 dark:text-blue-400'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {day.label}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Area Allocation */}
        <section className="lg:col-span-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-5">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white font-display">
              Time by Professional Area
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Where your cognitive hours are invested
            </p>
          </div>

          <div className="space-y-3.5">
            {stats.projectBreakdown.map((row) => (
              <div key={row.area} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {row.area}
                  </span>
                  <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400">
                    {row.minutes}m ({row.share}%)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    style={{width: `${row.share}%`}}
                    className="h-full rounded-full bg-blue-600 dark:bg-blue-500 transition-all"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Local Data Portability & Reset */}
      <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Local-First Storage &amp; Portability
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            All tasks, time blocks, sessions, and notes are stored offline-first on this device. Export anytime as JSON.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleExportJSON}
            className="inline-flex items-center gap-1.5 min-h-[40px] px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
          >
            <Download className="w-4 h-4" />
            <span>Export JSON</span>
          </button>

          {confirmReset ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onResetDemoData();
                  setConfirmReset(false);
                }}
                className="min-h-[40px] px-3.5 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors whitespace-nowrap"
              >
                Confirm Reset
              </button>
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="min-h-[40px] px-3 py-2 rounded-lg text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="inline-flex items-center gap-1.5 min-h-[40px] px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset Sample Data</span>
            </button>
          )}
        </div>
      </section>
    </div>
  );
};
