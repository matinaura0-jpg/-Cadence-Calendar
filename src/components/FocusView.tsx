import React, {useEffect, useMemo, useState} from 'react';
import {
  CheckCircle2,
  Maximize2,
  Minimize2,
  Minus,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Volume2,
  VolumeX,
  Waves,
} from 'lucide-react';
import {FocusSession, ProjectArea, TaskItem} from '../types/productivity';
import {
  playCompletionChime,
  startAmbientFocusNoise,
  stopAmbientFocusNoise,
} from '../utils/audio';

interface FocusViewProps {
  tasks: TaskItem[];
  sessions: FocusSession[];
  activeTaskId: string | null;
  onSelectActiveTaskId: (id: string | null) => void;
  onLogFocusSession: (session: Omit<FocusSession, 'id' | 'completedAt'>) => void;
  onCompleteTask: (id: string) => void;
}

type TimerMode = 'deep' | 'pomodoro' | 'sprint' | 'break';

const PRESETS: {mode: TimerMode; label: string; minutes: number}[] = [
  {mode: 'deep', label: 'Deep Work', minutes: 50},
  {mode: 'pomodoro', label: 'Pomodoro', minutes: 25},
  {mode: 'sprint', label: 'Sprint', minutes: 15},
  {mode: 'break', label: 'Break', minutes: 5},
];

export const FocusView: React.FC<FocusViewProps> = ({
  tasks,
  sessions,
  activeTaskId,
  onSelectActiveTaskId,
  onLogFocusSession,
  onCompleteTask,
}) => {
  const [mode, setMode] = useState<TimerMode>('deep');
  const [durationMinutes, setDurationMinutes] = useState<number>(50);
  const [secondsLeft, setSecondsLeft] = useState<number>(50 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [chimeEnabled, setChimeEnabled] = useState<boolean>(true);
  const [ambientEnabled, setAmbientEnabled] = useState<boolean>(false);
  const [fullscreenMode, setFullscreenMode] = useState<boolean>(false);
  const [justCompletedMsg, setJustCompletedMsg] = useState<string | null>(null);

  const activeTasks = useMemo(() => tasks.filter((t) => !t.completed), [tasks]);
  const selectedTask = useMemo(
    () => tasks.find((t) => t.id === activeTaskId) || null,
    [tasks, activeTaskId]
  );

  // Sync ambient brown noise with active focus state
  useEffect(() => {
    if (ambientEnabled && isRunning) {
      startAmbientFocusNoise();
    } else {
      stopAmbientFocusNoise();
    }
    return () => {
      stopAmbientFocusNoise();
    };
  }, [ambientEnabled, isRunning]);

  // Countdown tick
  useEffect(() => {
    if (!isRunning) return;

    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          setIsRunning(false);
          if (chimeEnabled) {
            playCompletionChime();
          }
          const taskTitle = selectedTask?.title || (mode === 'break' ? 'Recovery Break' : 'Focused Session');
          const project: ProjectArea = selectedTask?.project || 'Strategy';
          onLogFocusSession({
            taskId: selectedTask?.id || null,
            taskTitle,
            project,
            durationMinutes,
            mode,
          });
          setJustCompletedMsg(`Logged ${durationMinutes}m for "${taskTitle}"`);
          return durationMinutes * 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isRunning, chimeEnabled, durationMinutes, mode, selectedTask, onLogFocusSession]);

  // Keyboard shortcut: Space to toggle timer when not typing in an input
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT')
      ) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        setIsRunning((r) => !r);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const switchPreset = (nextMode: TimerMode, mins: number) => {
    setIsRunning(false);
    setMode(nextMode);
    setDurationMinutes(mins);
    setSecondsLeft(mins * 60);
    setJustCompletedMsg(null);
  };

  const adjustMinutes = (delta: number) => {
    if (isRunning) return;
    const next = Math.max(5, Math.min(120, durationMinutes + delta));
    setDurationMinutes(next);
    setSecondsLeft(next * 60);
  };

  const handleReset = () => {
    setIsRunning(false);
    setSecondsLeft(durationMinutes * 60);
    setJustCompletedMsg(null);
  };

  const handleCompleteEarly = () => {
    const elapsedMinutes = Math.max(
      1,
      Math.round((durationMinutes * 60 - secondsLeft) / 60)
    );
    setIsRunning(false);
    if (chimeEnabled) playCompletionChime();
    const taskTitle = selectedTask?.title || 'Focused Session';
    const project: ProjectArea = selectedTask?.project || 'Strategy';
    onLogFocusSession({
      taskId: selectedTask?.id || null,
      taskTitle,
      project,
      durationMinutes: elapsedMinutes,
      mode,
    });
    setSecondsLeft(durationMinutes * 60);
    setJustCompletedMsg(`Logged ${elapsedMinutes}m session for "${taskTitle}"`);
  };

  const minsDisplay = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const secsDisplay = String(secondsLeft % 60).padStart(2, '0');
  const totalSeconds = durationMinutes * 60;
  const progress = totalSeconds > 0 ? (totalSeconds - secondsLeft) / totalSeconds : 0;
  const radius = 112;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  const todayPrefix = new Date().toISOString().slice(0, 10);
  const todaySessions = sessions.filter((s) => s.completedAt.startsWith(todayPrefix));
  const todayMinutes = todaySessions.reduce((acc, s) => acc + s.durationMinutes, 0);

  return (
    <div
      className={
        fullscreenMode
          ? 'fixed inset-0 z-50 bg-slate-950 text-white flex flex-col items-center justify-center p-6 overflow-y-auto'
          : 'grid grid-cols-1 xl:grid-cols-12 gap-6 items-start'
      }
    >
      {/* Main Timer Card */}
      <section
        className={
          fullscreenMode
            ? 'w-full max-w-xl flex flex-col items-center text-center'
            : 'xl:col-span-7 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 flex flex-col items-center text-center'
        }
      >
        <div className="w-full flex items-center justify-between gap-4">
          <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 overflow-x-auto max-w-full">
            {PRESETS.map((preset) => (
              <button
                key={preset.mode}
                type="button"
                onClick={() => switchPreset(preset.mode, preset.minutes)}
                className={`min-h-[36px] px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  mode === preset.mode
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setFullscreenMode((f) => !f)}
            aria-label={fullscreenMode ? 'Exit distraction-free mode' : 'Enter distraction-free mode'}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
          >
            {fullscreenMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>

        {/* Circular SVG Ring + Tabular Clock */}
        <div className="relative my-8 flex items-center justify-center">
          <svg className="w-64 h-64 sm:w-72 sm:h-72 -rotate-90" viewBox="0 0 260 260">
            <circle
              cx="130"
              cy="130"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="10"
              className={fullscreenMode ? 'text-slate-800' : 'text-slate-100 dark:text-slate-800'}
            />
            <circle
              cx="130"
              cy="130"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="text-blue-600 dark:text-blue-500 transition-[stroke-dashoffset] duration-300"
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {mode === 'break' ? 'Recovery Window' : isRunning ? 'Focusing' : 'Ready'}
            </span>
            <div className="mt-1 text-5xl sm:text-6xl font-mono font-semibold tracking-tight tabular-nums">
              {minsDisplay}:{secsDisplay}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                disabled={isRunning}
                onClick={() => adjustMinutes(-5)}
                aria-label="Decrease duration by 5 minutes"
                className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-md border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-35 transition-colors"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400 w-12 text-center">
                {durationMinutes}m
              </span>
              <button
                type="button"
                disabled={isRunning}
                onClick={() => adjustMinutes(5)}
                aria-label="Increase duration by 5 minutes"
                className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-md border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-35 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Active Task Binding */}
        <div className="w-full max-w-md space-y-2 text-left">
          <label
            htmlFor="focus-task-select"
            className="block text-xs font-medium text-slate-500 dark:text-slate-400"
          >
            Linked Deliverable
          </label>
          <select
            id="focus-task-select"
            value={activeTaskId || ''}
            onChange={(e) => onSelectActiveTaskId(e.target.value || null)}
            className={`w-full min-h-[44px] px-3.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 ${
              fullscreenMode
                ? 'bg-slate-900 border-slate-800 text-white'
                : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white'
            }`}
          >
            <option value="">General Deep Work (No specific task)</option>
            {activeTasks.map((t) => (
              <option key={t.id} value={t.id}>
                [{t.project}] {t.title}
              </option>
            ))}
          </select>
        </div>

        {/* Primary Controls */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => {
              setJustCompletedMsg(null);
              setIsRunning((r) => !r);
            }}
            className="inline-flex items-center justify-center gap-2 min-h-[48px] px-7 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors whitespace-nowrap"
          >
            {isRunning ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            <span>{isRunning ? 'Pause Session' : 'Start Focus'}</span>
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center justify-center gap-1.5 min-h-[48px] px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </button>

          {secondsLeft < durationMinutes * 60 && (
            <button
              type="button"
              onClick={handleCompleteEarly}
              className="inline-flex items-center justify-center gap-1.5 min-h-[48px] px-4 py-2.5 rounded-xl border border-emerald-600/30 text-emerald-600 dark:text-emerald-400 text-sm font-medium hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors whitespace-nowrap"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Log Elapsed</span>
            </button>
          )}
        </div>

        {/* Audio & Task Complete Toggles */}
        <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800 w-full flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setAmbientEnabled((a) => !a)}
            className={`inline-flex items-center gap-2 min-h-[40px] px-3.5 py-2 rounded-lg text-xs font-medium border transition-colors ${
              ambientEnabled
                ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Waves className="w-4 h-4" />
            <span>{ambientEnabled ? 'Brown Noise On' : 'Brown Noise Off'}</span>
          </button>

          <button
            type="button"
            onClick={() => setChimeEnabled((c) => !c)}
            className={`inline-flex items-center gap-2 min-h-[40px] px-3.5 py-2 rounded-lg text-xs font-medium border transition-colors ${
              chimeEnabled
                ? 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                : 'border-slate-200 dark:border-slate-800 text-slate-400'
            }`}
          >
            {chimeEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span>{chimeEnabled ? 'Chime Enabled' : 'Chime Muted'}</span>
          </button>

          {selectedTask && !selectedTask.completed && (
            <button
              type="button"
              onClick={() => onCompleteTask(selectedTask.id)}
              className="inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Mark Task Complete</span>
            </button>
          )}
        </div>

        {justCompletedMsg && (
          <div
            role="status"
            className="mt-4 w-full rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 px-4 py-3 text-xs font-medium text-emerald-800 dark:text-emerald-200"
          >
            {justCompletedMsg}
          </div>
        )}
      </section>

      {/* Right Column: Today's Session Log (Hidden in Fullscreen) */}
      {!fullscreenMode && (
        <aside className="xl:col-span-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white font-display">
                Today&apos;s Focus Ledger
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
                {todaySessions.length} sessions · {todayMinutes} minutes logged today
              </p>
            </div>
          </div>

          {todaySessions.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">
              No focus blocks logged yet today. Start the timer to record your first deep-work sprint.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {todaySessions.map((session) => {
                const timeStr = new Date(session.completedAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                });
                return (
                  <div
                    key={session.id}
                    className="px-5 py-3.5 flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                        {session.taskTitle}
                      </p>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                        <span>{session.project}</span>
                        <span aria-hidden="true">·</span>
                        <span className="capitalize">{session.mode}</span>
                        <span aria-hidden="true">·</span>
                        <span>{timeStr}</span>
                      </div>
                    </div>
                    <span className="text-sm font-mono font-semibold tabular-nums text-blue-600 dark:text-blue-400 shrink-0">
                      {session.durationMinutes}m
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          <div className="px-5 py-4 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
            Keyboard shortcut: press <kbd className="font-mono px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200">Space</kbd> to start or pause timer.
          </div>
        </aside>
      )}
    </div>
  );
};
