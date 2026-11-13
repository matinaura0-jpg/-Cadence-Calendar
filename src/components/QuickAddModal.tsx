import React, {useEffect, useRef, useState} from 'react';
import {Clock, Plus, X} from 'lucide-react';
import {
  DueBucket,
  PRIORITY_LABELS,
  PriorityLevel,
  PROJECT_AREAS,
  ProjectArea,
  TaskItem,
} from '../types/productivity';

interface QuickAddModalProps {
  isOpen: boolean;
  initialHour?: number | null;
  editingTask?: TaskItem | null;
  onClose: () => void;
  onSaveTask: (taskData: {
    id?: string;
    title: string;
    notes: string;
    project: ProjectArea;
    priority: PriorityLevel;
    estimatedMinutes: number;
    dueBucket: DueBucket;
    scheduledHour: number | null;
    isTopPriority: boolean;
  }) => void;
}

const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120];
const HOURS = Array.from({length: 16}, (_, i) => i + 6); // 6..21

function formatHourLabel(hour: number): string {
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}:00 ${suffix}`;
}

export const QuickAddModal: React.FC<QuickAddModalProps> = ({
  isOpen,
  initialHour = null,
  editingTask = null,
  onClose,
  onSaveTask,
}) => {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [project, setProject] = useState<ProjectArea>('Client Work');
  const [priority, setPriority] = useState<PriorityLevel>('high');
  const [estimatedMinutes, setEstimatedMinutes] = useState<number>(45);
  const [dueBucket, setDueBucket] = useState<DueBucket>('Today');
  const [scheduledHour, setScheduledHour] = useState<number | null>(null);
  const [isTopPriority, setIsTopPriority] = useState(false);

  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (editingTask) {
      setTitle(editingTask.title);
      setNotes(editingTask.notes || '');
      setProject(editingTask.project);
      setPriority(editingTask.priority);
      setEstimatedMinutes(editingTask.estimatedMinutes);
      setDueBucket(editingTask.dueBucket);
      setScheduledHour(editingTask.scheduledHour ?? null);
      setIsTopPriority(Boolean(editingTask.isTopPriority));
    } else {
      setTitle('');
      setNotes('');
      setProject('Client Work');
      setPriority('high');
      setEstimatedMinutes(45);
      setDueBucket(initialHour !== null ? 'Today' : 'Today');
      setScheduledHour(initialHour);
      setIsTopPriority(false);
    }
    setTimeout(() => titleRef.current?.focus(), 40);
  }, [isOpen, initialHour, editingTask]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    onSaveTask({
      id: editingTask?.id,
      title: trimmed,
      notes: notes.trim(),
      project,
      priority,
      estimatedMinutes,
      dueBucket: scheduledHour !== null ? 'Today' : dueBucket,
      scheduledHour,
      isTopPriority,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/60 backdrop-blur-sm p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-add-heading"
    >
      <div className="w-full sm:max-w-xl rounded-t-3xl sm:rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        <div className="w-10 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mt-3 sm:hidden" />

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between gap-4">
            <h2
              id="quick-add-heading"
              className="text-lg font-semibold text-slate-900 dark:text-white font-display"
            >
              {editingTask ? 'Edit Task' : 'New Task & Time Block'}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close task dialog"
              className="min-h-[44px] min-w-[44px] -mr-2 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label htmlFor="task-title-input" className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                Task outcome
              </label>
              <input
                ref={titleRef}
                id="task-title-input"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Review Q4 engineering roadmap and assign owners"
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label htmlFor="task-notes-input" className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                Context or acceptance criteria (optional)
              </label>
              <textarea
                id="task-notes-input"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Key links, definitions of done, or reminders..."
                className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="task-project-select" className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                Area / Project
              </label>
              <select
                id="task-project-select"
                value={project}
                onChange={(e) => setProject(e.target.value as ProjectArea)}
                className="w-full min-h-[44px] px-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                {PROJECT_AREAS.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                Priority
              </span>
              <div className="grid grid-cols-4 gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800/80">
                {(['urgent', 'high', 'normal', 'low'] as PriorityLevel[]).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setPriority(lvl)}
                    className={`min-h-[36px] px-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                      priority === lvl
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {PRIORITY_LABELS[lvl]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <span className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                Estimated duration
              </span>
              <div className="flex flex-wrap gap-1.5">
                {DURATION_OPTIONS.map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setEstimatedMinutes(mins)}
                    className={`min-h-[36px] px-2.5 text-xs font-mono tabular-nums rounded-md border transition-colors ${
                      estimatedMinutes === mins
                        ? 'border-blue-600 bg-blue-600 text-white font-medium'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="task-slot-select" className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                Schedule time block (Today)
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  id="task-slot-select"
                  value={scheduledHour === null ? '' : String(scheduledHour)}
                  onChange={(e) => {
                    const val = e.target.value;
                    setScheduledHour(val === '' ? null : Number(val));
                  }}
                  className="w-full min-h-[44px] pl-9 pr-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="">Unscheduled ({dueBucket})</option>
                  {HOURS.map((hr) => (
                    <option key={hr} value={hr}>
                      Today at {formatHourLabel(hr)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-200 dark:border-slate-800">
            <label className="inline-flex items-center gap-2.5 min-h-[44px] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isTopPriority}
                onChange={(e) => setIsTopPriority(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">
                Pin to Today&apos;s Top 3 Priorities
              </span>
            </label>

            <div className="flex items-center gap-2.5 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="min-h-[44px] px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 min-h-[44px] px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>{editingTask ? 'Save Changes' : 'Add Task'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
