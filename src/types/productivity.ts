export type NavView = 'today' | 'focus' | 'tasks' | 'notes' | 'insights';

export type PriorityLevel = 'urgent' | 'high' | 'normal' | 'low';

export type ProjectArea = 'Client Work' | 'Engineering' | 'Strategy' | 'Operations' | 'Personal';

export type DueBucket = 'Today' | 'Tomorrow' | 'This Week' | 'Backlog';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface TaskItem {
  id: string;
  title: string;
  notes?: string;
  project: ProjectArea;
  priority: PriorityLevel;
  estimatedMinutes: number;
  loggedFocusMinutes: number;
  dueBucket: DueBucket;
  scheduledHour?: number | null; // 6..21 (24-hour clock)
  isTopPriority?: boolean;
  completed: boolean;
  completedAt?: string | null;
  createdAt: string;
  subtasks: Subtask[];
}

export interface FocusSession {
  id: string;
  taskId: string | null;
  taskTitle: string;
  project: ProjectArea;
  durationMinutes: number;
  mode: 'deep' | 'pomodoro' | 'sprint' | 'break';
  completedAt: string; // ISO date string
}

export interface QuickNote {
  id: string;
  title: string;
  content: string;
  project: ProjectArea;
  pinned: boolean;
  updatedAt: string;
}

export interface DailyReflection {
  dateKey: string; // YYYY-MM-DD
  morningIntention: string;
  dailyWin: string;
  tomorrowTopFocus: string;
  shutdownCompleted: boolean;
}

export interface WorkspaceData {
  tasks: TaskItem[];
  sessions: FocusSession[];
  notes: QuickNote[];
  reflection: DailyReflection;
}

export const PROJECT_AREAS: ProjectArea[] = [
  'Client Work',
  'Engineering',
  'Strategy',
  'Operations',
  'Personal',
];

export const PRIORITY_LABELS: Record<PriorityLevel, string> = {
  urgent: 'Urgent',
  high: 'High',
  normal: 'Normal',
  low: 'Low',
};
