import React, {useMemo, useState} from 'react';
import {
  CalendarPlus,
  Check,
  Clock,
  Play,
  Plus,
  Star,
  Sun,
} from 'lucide-react';
import {DailyReflection, PRIORITY_LABELS, TaskItem} from '../types/productivity';

interface TodayViewProps {
  tasks: TaskItem[];
  reflection: DailyReflection;
  onUpdateReflection: (patch: Partial<DailyReflection>) => void;
  onToggleTask: (id: string) => void;
  onToggleTopPriority: (id: string) => void;
  onScheduleTaskHour: (id: string, hour: number | null) => void;
  onOpenNewTaskModal: (hour?: number | null) => void;
  onStartFocusOnTask: (task: TaskItem) => void;
}

const PLANNER_HOURS = Array.from({length: 14}, (_, i) => i + 7); // 7 AM - 8 PM

function formatHour(hour: number): string {
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${String(h12).padStart(2, '0')}:00 ${suffix}`;
}

export const TodayView: React.FC<TodayViewProps> = ({
  tasks,
  reflection,
  onUpdateReflection,
  onToggleTask,
  onToggleTopPriority,
  onScheduleTaskHour,
  onOpenNewTaskModal,
  onStartFocusOnTask,
}) => {
  const [quickTitle, setQuickTitle] = useState('');
  const currentHour = new Date().getHours();

  const topPriorities = useMemo(
    () => tasks.filter((t) => t.isTopPriority).slice(0, 3),
    [tasks]
  );

  const scheduledMap = useMemo(() => {
    const map = new Map<number, TaskItem[]>();
    for (const task of tasks) {
      if (typeof task.scheduledHour === 'number') {
        const list = map.get(task.scheduledHour) || [];
        list.push(task);
        map.set(task.scheduledHour, list);
      }
    }
    return map;
  }, [tasks]);

  const unscheduledQueue = useMemo(
    () =>
      tasks.filter(
        (t) =>
          !t.completed &&
          (t.scheduledHour === null || t.scheduledHour === undefined)
      ),
    [tasks]
  );

  const todayTasks = useMemo(
    () =>
      tasks.filter(
        (t) => t.dueBucket === 'Today' || typeof t.scheduledHour === 'number'
      ),
    [tasks]
  );

  const completedTodayCount = todayTasks.filter((t) => t.completed).length;
  const totalScheduledMinutes = todayTasks.reduce(
    (sum, t) => sum + t.estimatedMinutes,
    0
  );

  const findNextOpenHour = (): number => {
    const start = Math.max(8, Math.min(19, currentHour));
    for (let h = start; h <= 20; h++) {
      if (!scheduledMap.has(h)) return h;
    }
    return 9;
  };

  const handleQuickPriorityAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = quickTitle.trim();
    if (!trimmed) return;
    onOpenNewTaskModal(null);
    setQuickTitle('');
  };

  return (
    <div className="space-y-6">
      {/* Daily Intention & Summary Strip */}
      <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
              <Sun className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Daily Intention</span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">
                {completedTodayCount} of {todayTasks.length} today tasks done
              </span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">
                {Math.round((totalScheduledMinutes / 60) * 10) / 10}h planned
              </span>
            </div>
            <input
              type="text"
              value={reflection.morningIntention}
              onChange={(e) =>
                onUpdateReflection({morningIntention: e.target.value})
              }
              aria-label="Daily intention"
              placeholder="What single outcome makes today a clear win?"
              className="mt-2 w-full bg-transparent text-lg sm:text-xl font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none font-display"
            />
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onOpenNewTaskModal(findNextOpenHour())}
              className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Block Time</span>
            </button>
          </div>
        </div>

        {/* Top 3 Must-Do Priorities */}
        <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between gap-4 mb-3">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Top 3 Must-Do Priorities
            </h2>
            <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
              {topPriorities.filter((t) => t.completed).length}/
              {topPriorities.length} completed
            </span>
          </div>

          {topPriorities.length === 0 ? (
            <form
              onSubmit={handleQuickPriorityAdd}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 py-3 text-sm text-slate-500 dark:text-slate-400"
            >
              <span>
                No priorities pinned yet. Star any task below or create a priority block.
              </span>
              <button
                type="button"
                onClick={() => onOpenNewTaskModal(9)}
                className="text-left sm:text-center text-blue-600 dark:text-blue-400 font-medium hover:underline whitespace-nowrap shrink-0"
              >
                + Add Priority Task
              </button>
            </form>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {topPriorities.map((task, idx) => (
                <div
                  key={task.id}
                  className={`flex items-start justify-between gap-3 p-3.5 rounded-xl border transition-colors ${
                    task.completed
                      ? 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 opacity-75'
                      : 'bg-slate-50/70 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onToggleTask(task.id)}
                    aria-label={
                      task.completed
                        ? `Mark ${task.title} incomplete`
                        : `Complete ${task.title}`
                    }
                    className={`mt-0.5 w-6 h-6 min-w-[24px] rounded-md border flex items-center justify-center transition-colors ${
                      task.completed
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'border-slate-300 dark:border-slate-700 hover:border-blue-600'
                    }`}
                  >
                    {task.completed && <Check className="w-3.5 h-3.5" />}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                      0{idx + 1}. {task.project} · {task.estimatedMinutes}m
                    </div>
                    <p
                      className={`mt-0.5 text-sm font-medium leading-snug ${
                        task.completed
                          ? 'line-through text-slate-400 dark:text-slate-500'
                          : 'text-slate-900 dark:text-slate-100'
                      }`}
                    >
                      {task.title}
                    </p>
                  </div>

                  {!task.completed && (
                    <button
                      type="button"
                      onClick={() => onStartFocusOnTask(task)}
                      title="Start focus timer on this task"
                      aria-label={`Focus on ${task.title}`}
                      className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors shrink-0"
                    >
                      <Play className="w-4 h-4 fill-current" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Main Split: Hourly Time-Block Timeline + Ready-to-Schedule Queue */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left: Daily Time-Block Schedule */}
        <section className="xl:col-span-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white font-display">
                Time-Blocked Schedule
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Assign focus blocks directly to hourly slots or click any open hour to schedule.
              </p>
            </div>
            <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400 whitespace-nowrap">
              {formatHour(Math.max(7, Math.min(20, currentHour)))} now
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {PLANNER_HOURS.map((hour) => {
              const slotTasks = scheduledMap.get(hour) || [];
              const isCurrent = hour === currentHour;

              return (
                <div
                  key={hour}
                  className={`flex flex-col sm:flex-row sm:items-stretch transition-colors ${
                    isCurrent ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''
                  }`}
                >
                  <div className="sm:w-28 px-5 py-3 sm:py-3.5 flex items-center justify-between sm:justify-start gap-2 sm:border-r border-slate-100 dark:border-slate-800/80 shrink-0">
                    <span
                      className={`text-xs font-mono tabular-nums ${
                        isCurrent
                          ? 'text-blue-600 dark:text-blue-400 font-semibold'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {formatHour(hour)}
                    </span>
                    {isCurrent && (
                      <span className="text-[11px] font-medium text-blue-600 dark:text-blue-400 sm:hidden">
                        Current
                      </span>
                    )}
                  </div>

                  <div className="flex-1 px-4 pb-3 sm:py-2.5 flex flex-col justify-center gap-2 min-h-[56px]">
                    {slotTasks.length === 0 ? (
                      <button
                        type="button"
                        onClick={() => onOpenNewTaskModal(hour)}
                        className="group w-full min-h-[40px] px-3 rounded-lg border border-dashed border-transparent hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40 flex items-center justify-between text-left transition-colors"
                      >
                        <span className="text-xs text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300">
                          Open slot — schedule a focus block
                        </span>
                        <Plus className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ) : (
                      slotTasks.map((task) => (
                        <div
                          key={task.id}
                          className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <button
                              type="button"
                              onClick={() => onToggleTask(task.id)}
                              aria-label={
                                task.completed
                                  ? `Mark ${task.title} incomplete`
                                  : `Complete ${task.title}`
                              }
                              className={`w-6 h-6 min-w-[24px] rounded-md border flex items-center justify-center transition-colors shrink-0 ${
                                task.completed
                                  ? 'bg-emerald-600 border-emerald-600 text-white'
                                  : 'border-slate-300 dark:border-slate-700 hover:border-blue-600'
                              }`}
                            >
                              {task.completed && <Check className="w-3.5 h-3.5" />}
                            </button>

                            <div className="min-w-0">
                              <p
                                className={`text-sm font-medium truncate ${
                                  task.completed
                                    ? 'line-through text-slate-400 dark:text-slate-500'
                                    : 'text-slate-900 dark:text-slate-100'
                                }`}
                              >
                                {task.title}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                                <span>{task.project}</span>
                                <span aria-hidden="true">·</span>
                                <span>{task.estimatedMinutes}m</span>
                                <span aria-hidden="true">·</span>
                                <span>{PRIORITY_LABELS[task.priority]}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => onToggleTopPriority(task.id)}
                              title={
                                task.isTopPriority
                                  ? 'Remove from Top 3 Priorities'
                                  : 'Pin to Top 3 Priorities'
                              }
                              aria-label="Toggle top priority"
                              className={`min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg transition-colors ${
                                task.isTopPriority
                                  ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40'
                                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                              }`}
                            >
                              <Star
                                className={`w-4 h-4 ${
                                  task.isTopPriority ? 'fill-current' : ''
                                }`}
                              />
                            </button>
                            {!task.completed && (
                              <button
                                type="button"
                                onClick={() => onStartFocusOnTask(task)}
                                className="inline-flex items-center gap-1.5 min-h-[36px] px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors whitespace-nowrap"
                              >
                                <Play className="w-3.5 h-3.5 fill-current" />
                                <span>Focus</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => onScheduleTaskHour(task.id, null)}
                              title="Unschedule from today timeline"
                              className="min-h-[36px] px-2.5 rounded-lg text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
                            >
                              Unblock
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Right: Ready to Schedule Queue */}
        <aside className="xl:col-span-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white font-display">
                Unscheduled Queue
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
                {unscheduledQueue.length} active items ready to pull into today
              </p>
            </div>
          </div>

          {unscheduledQueue.length === 0 ? (
            <div className="p-6 text-center">
              <Clock className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto" />
              <p className="mt-3 text-sm font-medium text-slate-900 dark:text-white">
                All active tasks are scheduled
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Capture new deliverables anytime without interrupting your current block.
              </p>
              <button
                type="button"
                onClick={() => onOpenNewTaskModal(null)}
                className="mt-4 inline-flex items-center gap-1.5 min-h-[40px] px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Task</span>
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {unscheduledQueue.map((task) => {
                const nextHour = findNextOpenHour();
                return (
                  <div key={task.id} className="p-4 hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 leading-snug">
                          {task.title}
                        </p>
                        <div className="mt-1 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                          <span>{task.project}</span>
                          <span aria-hidden="true">·</span>
                          <span>{task.estimatedMinutes}m</span>
                          <span aria-hidden="true">·</span>
                          <span>{task.dueBucket}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onScheduleTaskHour(task.id, nextHour)}
                        className="inline-flex items-center gap-1.5 min-h-[36px] px-3 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-medium hover:opacity-90 transition-opacity whitespace-nowrap"
                      >
                        <CalendarPlus className="w-3.5 h-3.5" />
                        <span>Schedule {formatHour(nextHour)}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onStartFocusOnTask(task)}
                        className="inline-flex items-center gap-1.5 min-h-[36px] px-3 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Start Now</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};
