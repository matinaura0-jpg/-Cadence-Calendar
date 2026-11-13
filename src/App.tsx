import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  BarChart3,
  CalendarDays,
  CheckSquare,
  FileText,
  Moon,
  Plus,
  Sun,
  Timer,
} from 'lucide-react';
import {FocusView} from './components/FocusView';
import {InsightsView} from './components/InsightsView';
import {NotesView} from './components/NotesView';
import {OfflineIndicator} from './components/OfflineIndicator';
import {PWAInstallButton} from './components/PWAInstallButton';
import {QuickAddModal} from './components/QuickAddModal';
import {TasksView} from './components/TasksView';
import {TodayView} from './components/TodayView';
import {
  getTodayDateKey,
  loadWorkspace,
  resetWorkspace,
  saveWorkspace,
} from './data/seedData';
import {
  DailyReflection,
  DueBucket,
  FocusSession,
  NavView,
  PriorityLevel,
  ProjectArea,
  QuickNote,
  TaskItem,
  WorkspaceData,
} from './types/productivity';

const NAV_ITEMS: {
  id: NavView;
  label: string;
  shortcut: string;
  icon: React.ComponentType<{className?: string}>;
}[] = [
  {id: 'today', label: 'Today', shortcut: '1', icon: CalendarDays},
  {id: 'focus', label: 'Focus', shortcut: '2', icon: Timer},
  {id: 'tasks', label: 'Tasks', shortcut: '3', icon: CheckSquare},
  {id: 'notes', label: 'Notes', shortcut: '4', icon: FileText},
  {id: 'insights', label: 'Insights', shortcut: '5', icon: BarChart3},
];

export default function App() {
  const [workspace, setWorkspace] = useState<WorkspaceData>(() => loadWorkspace());
  const [activeView, setActiveView] = useState<NavView>(() => {
    const params = new URLSearchParams(window.location.search);
    const v = params.get('view') as NavView | null;
    if (v && NAV_ITEMS.some((n) => n.id === v)) return v;
    return 'today';
  });
  const [isDark, setIsDark] = useState<boolean>(() =>
    document.documentElement.classList.contains('dark')
  );
  const [activeFocusTaskId, setActiveFocusTaskId] = useState<string | null>(
    () => workspace.tasks.find((t) => !t.completed)?.id || null
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [modalInitialHour, setModalInitialHour] = useState<number | null>(null);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);

  // Persist workspace to localStorage whenever state changes
  useEffect(() => {
    saveWorkspace(workspace);
  }, [workspace]);

  // Global desktop keyboard shortcuts (Cmd/Ctrl+K for quick add, 1-5 for views)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setEditingTask(null);
        setModalInitialHour(null);
        setModalOpen(true);
        return;
      }

      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT')
      ) {
        return;
      }

      if (!e.metaKey && !e.ctrlKey && !e.altKey) {
        const navMatch = NAV_ITEMS.find((item) => item.shortcut === e.key);
        if (navMatch) {
          setActiveView(navMatch.id);
        } else if (e.key.toLowerCase() === 'n') {
          e.preventDefault();
          setEditingTask(null);
          setModalInitialHour(null);
          setModalOpen(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle('dark', next);
    try {
      localStorage.setItem('cadence_theme', next ? 'dark' : 'light');
    } catch {
      // ignore
    }
  };

  const todayFormatted = useMemo(() => {
    return new Date().toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
  }, []);

  const todayKey = getTodayDateKey(0);
  const focusMinutesToday = useMemo(
    () =>
      workspace.sessions
        .filter((s) => s.completedAt.slice(0, 10) === todayKey)
        .reduce((acc, s) => acc + s.durationMinutes, 0),
    [workspace.sessions, todayKey]
  );

  // Task handlers
  const handleSaveTask = useCallback(
    (data: {
      id?: string;
      title: string;
      notes: string;
      project: ProjectArea;
      priority: PriorityLevel;
      estimatedMinutes: number;
      dueBucket: DueBucket;
      scheduledHour: number | null;
      isTopPriority: boolean;
    }) => {
      setWorkspace((prev) => {
        if (data.id) {
          return {
            ...prev,
            tasks: prev.tasks.map((t) =>
              t.id === data.id
                ? {
                    ...t,
                    title: data.title,
                    notes: data.notes,
                    project: data.project,
                    priority: data.priority,
                    estimatedMinutes: data.estimatedMinutes,
                    dueBucket: data.dueBucket,
                    scheduledHour: data.scheduledHour,
                    isTopPriority: data.isTopPriority,
                  }
                : t
            ),
          };
        }

        const newTask: TaskItem = {
          id: `t-${Date.now()}`,
          title: data.title,
          notes: data.notes,
          project: data.project,
          priority: data.priority,
          estimatedMinutes: data.estimatedMinutes,
          loggedFocusMinutes: 0,
          dueBucket: data.dueBucket,
          scheduledHour: data.scheduledHour,
          isTopPriority: data.isTopPriority,
          completed: false,
          completedAt: null,
          createdAt: new Date().toISOString(),
          subtasks: [],
        };

        return {
          ...prev,
          tasks: [newTask, ...prev.tasks],
        };
      });
    },
    []
  );

  const handleToggleTask = useCallback((id: string) => {
    setWorkspace((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.id === id
          ? {
              ...t,
              completed: !t.completed,
              completedAt: !t.completed ? new Date().toISOString() : null,
            }
          : t
      ),
    }));
  }, []);

  const handleToggleTopPriority = useCallback((id: string) => {
    setWorkspace((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.id === id ? {...t, isTopPriority: !t.isTopPriority} : t
      ),
    }));
  }, []);

  const handleScheduleTaskHour = useCallback((id: string, hour: number | null) => {
    setWorkspace((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.id === id
          ? {
              ...t,
              scheduledHour: hour,
              dueBucket: hour !== null ? 'Today' : t.dueBucket,
            }
          : t
      ),
    }));
  }, []);

  const handleScheduleTodayNextOpen = useCallback((id: string) => {
    setWorkspace((prev) => {
      const taken = new Set(
        prev.tasks
          .map((t) => t.scheduledHour)
          .filter((h): h is number => typeof h === 'number')
      );
      const start = Math.max(8, Math.min(19, new Date().getHours()));
      let targetHour = 9;
      for (let h = start; h <= 20; h++) {
        if (!taken.has(h)) {
          targetHour = h;
          break;
        }
      }
      return {
        ...prev,
        tasks: prev.tasks.map((t) =>
          t.id === id ? {...t, scheduledHour: targetHour, dueBucket: 'Today'} : t
        ),
      };
    });
  }, []);

  const handleToggleSubtask = useCallback((taskId: string, subtaskId: string) => {
    setWorkspace((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              subtasks: t.subtasks.map((st) =>
                st.id === subtaskId ? {...st, completed: !st.completed} : st
              ),
            }
          : t
      ),
    }));
  }, []);

  const handleAddSubtask = useCallback((taskId: string, title: string) => {
    setWorkspace((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              subtasks: [
                ...t.subtasks,
                {id: `st-${Date.now()}`, title, completed: false},
              ],
            }
          : t
      ),
    }));
  }, []);

  const handleDeleteTask = useCallback((id: string) => {
    setWorkspace((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((t) => t.id !== id),
    }));
  }, []);

  const handleStartFocusOnTask = useCallback((task: TaskItem) => {
    setActiveFocusTaskId(task.id);
    setActiveView('focus');
  }, []);

  const handleLogFocusSession = useCallback(
    (session: Omit<FocusSession, 'id' | 'completedAt'>) => {
      const newSession: FocusSession = {
        ...session,
        id: `s-${Date.now()}`,
        completedAt: new Date().toISOString(),
      };
      setWorkspace((prev) => ({
        ...prev,
        sessions: [newSession, ...prev.sessions],
        tasks: session.taskId
          ? prev.tasks.map((t) =>
              t.id === session.taskId
                ? {
                    ...t,
                    loggedFocusMinutes:
                      t.loggedFocusMinutes + session.durationMinutes,
                  }
                : t
            )
          : prev.tasks,
      }));
    },
    []
  );

  // Notes handlers
  const handleAddNote = useCallback(
    (note: Omit<QuickNote, 'id' | 'updatedAt'>): string => {
      const id = `n-${Date.now()}`;
      const created: QuickNote = {
        ...note,
        id,
        updatedAt: new Date().toISOString(),
      };
      setWorkspace((prev) => ({
        ...prev,
        notes: [created, ...prev.notes],
      }));
      return id;
    },
    []
  );

  const handleUpdateNote = useCallback((id: string, patch: Partial<QuickNote>) => {
    setWorkspace((prev) => ({
      ...prev,
      notes: prev.notes.map((n) =>
        n.id === id ? {...n, ...patch, updatedAt: new Date().toISOString()} : n
      ),
    }));
  }, []);

  const handleDeleteNote = useCallback((id: string) => {
    setWorkspace((prev) => ({
      ...prev,
      notes: prev.notes.filter((n) => n.id !== id),
    }));
  }, []);

  const handleConvertNoteToTask = useCallback(
    (title: string, project: ProjectArea, notes: string) => {
      handleSaveTask({
        title,
        notes,
        project,
        priority: 'high',
        estimatedMinutes: 30,
        dueBucket: 'Today',
        scheduledHour: null,
        isTopPriority: false,
      });
    },
    [handleSaveTask]
  );

  const handleUpdateReflection = useCallback(
    (patch: Partial<DailyReflection>) => {
      setWorkspace((prev) => ({
        ...prev,
        reflection: {...prev.reflection, ...patch},
      }));
    },
    []
  );

  const handleResetDemoData = useCallback(() => {
    const fresh = resetWorkspace();
    setWorkspace(fresh);
  }, []);

  const currentNav = NAV_ITEMS.find((n) => n.id === activeView) || NAV_ITEMS[0];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col lg:flex-row">
      {/* Desktop Sidebar (Windows / macOS) */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 h-screen">
        <div className="px-6 h-16 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
          <a
            href="/"
            className="text-lg font-bold tracking-tight text-slate-900 dark:text-white font-display whitespace-nowrap"
          >
            Cadence
          </a>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1" aria-label="Primary navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveView(item.id)}
                className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl flex items-center justify-between text-sm font-medium transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span className="flex items-center gap-3">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </span>
                <kbd
                  className={`text-[11px] font-mono px-1.5 py-0.5 rounded ${
                    active
                      ? 'bg-blue-700/80 text-blue-100'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {item.shortcut}
                </kbd>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
          <div className="px-1 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            <span>Focused today</span>
            <span className="font-mono font-semibold text-slate-900 dark:text-white">
              {focusMinutesToday}m
            </span>
          </div>
          <PWAInstallButton />
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Bar (3-zone contract, <=56px on mobile) */}
        <header className="sticky top-0 z-30 h-14 sm:h-16 px-4 sm:px-8 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md flex items-center justify-between gap-4 pt-safe">
          <div className="flex items-center gap-3 min-w-0">
            <span className="lg:hidden text-base font-bold tracking-tight text-slate-900 dark:text-white font-display whitespace-nowrap shrink-0">
              Cadence
            </span>
            <span className="lg:hidden text-slate-300 dark:text-slate-700" aria-hidden="true">
              /
            </span>
            <h1 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white font-display truncate">
              {currentNav.label}
            </h1>
            <span className="hidden sm:inline text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
              · {todayFormatted}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="lg:hidden">
              <PWAInstallButton compact />
            </div>

            <button
              type="button"
              onClick={toggleTheme}
              aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
              className="lg:hidden min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={() => {
                setEditingTask(null);
                setModalInitialHour(null);
                setModalOpen(true);
              }}
              className="inline-flex items-center justify-center gap-1.5 min-h-[40px] px-3.5 sm:px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Task</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>
        </header>

        {/* Active View Viewport (bottom padding reserves space for mobile tab bar) */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 py-6 pb-24 lg:pb-10">
          {activeView === 'today' && (
            <TodayView
              tasks={workspace.tasks}
              reflection={workspace.reflection}
              onUpdateReflection={handleUpdateReflection}
              onToggleTask={handleToggleTask}
              onToggleTopPriority={handleToggleTopPriority}
              onScheduleTaskHour={handleScheduleTaskHour}
              onOpenNewTaskModal={(hour) => {
                setEditingTask(null);
                setModalInitialHour(hour ?? null);
                setModalOpen(true);
              }}
              onStartFocusOnTask={handleStartFocusOnTask}
            />
          )}

          {activeView === 'focus' && (
            <FocusView
              tasks={workspace.tasks}
              sessions={workspace.sessions}
              activeTaskId={activeFocusTaskId}
              onSelectActiveTaskId={setActiveFocusTaskId}
              onLogFocusSession={handleLogFocusSession}
              onCompleteTask={handleToggleTask}
            />
          )}

          {activeView === 'tasks' && (
            <TasksView
              tasks={workspace.tasks}
              onToggleTask={handleToggleTask}
              onToggleSubtask={handleToggleSubtask}
              onAddSubtask={handleAddSubtask}
              onToggleTopPriority={handleToggleTopPriority}
              onScheduleTodayNextOpen={handleScheduleTodayNextOpen}
              onEditTask={(task) => {
                setEditingTask(task);
                setModalInitialHour(task.scheduledHour ?? null);
                setModalOpen(true);
              }}
              onDeleteTask={handleDeleteTask}
              onStartFocusOnTask={handleStartFocusOnTask}
              onOpenNewTaskModal={() => {
                setEditingTask(null);
                setModalInitialHour(null);
                setModalOpen(true);
              }}
            />
          )}

          {activeView === 'notes' && (
            <NotesView
              notes={workspace.notes}
              tasks={workspace.tasks}
              reflection={workspace.reflection}
              focusMinutesToday={focusMinutesToday}
              onAddNote={handleAddNote}
              onUpdateNote={handleUpdateNote}
              onDeleteNote={handleDeleteNote}
              onConvertNoteToTask={handleConvertNoteToTask}
              onUpdateReflection={handleUpdateReflection}
            />
          )}

          {activeView === 'insights' && (
            <InsightsView
              workspace={workspace}
              onResetDemoData={handleResetDemoData}
            />
          )}
        </main>
      </div>

      {/* Mobile Bottom Tab Bar (Android & iOS ergonomic thumb zone, <= 64px) */}
      <nav
        aria-label="Mobile navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 grid grid-cols-5 items-center h-16 pb-safe"
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = activeView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveView(item.id)}
              className={`min-h-[48px] flex flex-col items-center justify-center gap-0.5 transition-colors ${
                active
                  ? 'text-blue-600 dark:text-blue-400 font-semibold'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[11px] leading-tight whitespace-nowrap">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Responsive Quick Add / Edit Modal */}
      <QuickAddModal
        isOpen={modalOpen}
        initialHour={modalInitialHour}
        editingTask={editingTask}
        onClose={() => {
          setModalOpen(false);
          setEditingTask(null);
        }}
        onSaveTask={handleSaveTask}
      />

      <OfflineIndicator />
    </div>
  );
}
