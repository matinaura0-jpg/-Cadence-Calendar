import React, {useMemo, useState} from 'react';
import {
  AlertCircle,
  ArrowUpRight,
  CalendarPlus,
  Check,
  ChevronDown,
  ChevronRight,
  Edit3,
  Play,
  Plus,
  Search,
  Star,
  Trash2,
} from 'lucide-react';
import {
  PRIORITY_LABELS,
  PriorityLevel,
  PROJECT_AREAS,
  ProjectArea,
  TaskItem,
} from '../types/productivity';

interface TasksViewProps {
  tasks: TaskItem[];
  onToggleTask: (id: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onAddSubtask: (taskId: string, title: string) => void;
  onToggleTopPriority: (id: string) => void;
  onScheduleTodayNextOpen: (id: string) => void;
  onEditTask: (task: TaskItem) => void;
  onDeleteTask: (id: string) => void;
  onStartFocusOnTask: (task: TaskItem) => void;
  onOpenNewTaskModal: () => void;
}

const PRIORITY_WEIGHT: Record<PriorityLevel, number> = {
  urgent: 4,
  high: 3,
  normal: 2,
  low: 1,
};

export const TasksView: React.FC<TasksViewProps> = ({
  tasks,
  onToggleTask,
  onToggleSubtask,
  onAddSubtask,
  onToggleTopPriority,
  onScheduleTodayNextOpen,
  onEditTask,
  onDeleteTask,
  onStartFocusOnTask,
  onOpenNewTaskModal,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'active' | 'completed' | 'all'>('active');
  const [projectFilter, setProjectFilter] = useState<'All' | ProjectArea>('All');
  const [sortBy, setSortBy] = useState<'priority' | 'duration' | 'created'>('priority');
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [subtaskDrafts, setSubtaskDrafts] = useState<Record<string, string>>({});

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({...prev, [id]: !prev[id]}));
  };

  const filteredTasks = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tasks
      .filter((t) => {
        if (statusFilter === 'active' && t.completed) return false;
        if (statusFilter === 'completed' && !t.completed) return false;
        if (projectFilter !== 'All' && t.project !== projectFilter) return false;
        if (
          q &&
          !t.title.toLowerCase().includes(q) &&
          !(t.notes || '').toLowerCase().includes(q) &&
          !t.project.toLowerCase().includes(q)
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        if (sortBy === 'priority') {
          return PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority];
        }
        if (sortBy === 'duration') {
          return b.estimatedMinutes - a.estimatedMinutes;
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [tasks, search, statusFilter, projectFilter, sortBy]);

  const handleSubtaskSubmit = (e: React.FormEvent, taskId: string) => {
    e.preventDefault();
    const val = (subtaskDrafts[taskId] || '').trim();
    if (!val) return;
    onAddSubtask(taskId, val);
    setSubtaskDrafts((prev) => ({...prev, [taskId]: ''}));
  };

  const renderPriorityText = (priority: PriorityLevel) => {
    if (priority === 'urgent') {
      return (
        <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 font-medium">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{PRIORITY_LABELS[priority]}</span>
        </span>
      );
    }
    if (priority === 'high') {
      return (
        <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
          <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
          <span>{PRIORITY_LABELS[priority]}</span>
        </span>
      );
    }
    return <span>{PRIORITY_LABELS[priority]}</span>;
  };

  return (
    <div className="space-y-5">
      {/* Filter & Search Toolbar */}
      <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks, projects, or context..."
              aria-label="Search tasks"
              className="w-full min-h-[44px] pl-10 pr-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800/80">
              {(['active', 'completed', 'all'] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={`min-h-[36px] px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors whitespace-nowrap ${
                    statusFilter === status
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            <select
              aria-label="Sort tasks by"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'priority' | 'duration' | 'created')}
              className="min-h-[42px] px-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="priority">Sort: Priority</option>
              <option value="duration">Sort: Longest First</option>
              <option value="created">Sort: Most Recent</option>
            </select>

            <button
              type="button"
              onClick={onOpenNewTaskModal}
              className="inline-flex items-center gap-1.5 min-h-[42px] px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>New Task</span>
            </button>
          </div>
        </div>

        {/* Project Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {(['All', ...PROJECT_AREAS] as const).map((area) => (
            <button
              key={area}
              type="button"
              onClick={() => setProjectFilter(area)}
              className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                projectFilter === area
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {area}
            </button>
          ))}
        </div>
      </section>

      {/* Task List Table / Cards */}
      <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
        {filteredTasks.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-base font-semibold text-slate-900 dark:text-white font-display">
              No matching tasks
            </p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Adjust your search filters or create a new deliverable to get started.
            </p>
            <button
              type="button"
              onClick={onOpenNewTaskModal}
              className="mt-4 inline-flex items-center gap-1.5 min-h-[44px] px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Task</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredTasks.map((task) => {
              const isExpanded = !!expandedIds[task.id];
              const doneSubs = task.subtasks.filter((s) => s.completed).length;

              return (
                <div key={task.id} className="transition-colors hover:bg-slate-50/60 dark:hover:bg-slate-800/25">
                  <div className="px-4 sm:px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3.5 min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => onToggleTask(task.id)}
                        aria-label={task.completed ? `Mark ${task.title} incomplete` : `Complete ${task.title}`}
                        className={`mt-0.5 w-6 h-6 min-w-[24px] rounded-md border flex items-center justify-center transition-colors shrink-0 ${
                          task.completed
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-slate-300 dark:border-slate-700 hover:border-blue-600'
                        }`}
                      >
                        {task.completed && <Check className="w-3.5 h-3.5" />}
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => toggleExpand(task.id)}
                            className="text-left text-sm sm:text-[15px] font-medium text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1.5 min-w-0"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                            )}
                            <span className={task.completed ? 'line-through text-slate-400 dark:text-slate-500' : ''}>
                              {task.title}
                            </span>
                          </button>
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400 tabular-nums pl-5">
                          <span>{task.project}</span>
                          <span aria-hidden="true">·</span>
                          {renderPriorityText(task.priority)}
                          <span aria-hidden="true">·</span>
                          <span>{task.estimatedMinutes}m est</span>
                          {task.loggedFocusMinutes > 0 && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="text-blue-600 dark:text-blue-400">
                                {task.loggedFocusMinutes}m focused
                              </span>
                            </>
                          )}
                          <span aria-hidden="true">·</span>
                          <span>{task.dueBucket}</span>
                          {task.subtasks.length > 0 && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span>
                                {doneSubs}/{task.subtasks.length} steps
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Row Actions */}
                    <div className="flex items-center gap-1 pl-9 sm:pl-0 shrink-0">
                      <button
                        type="button"
                        onClick={() => onToggleTopPriority(task.id)}
                        aria-label="Pin as top priority"
                        title={task.isTopPriority ? 'Pinned to Top 3' : 'Pin to Top 3'}
                        className={`min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg transition-colors ${
                          task.isTopPriority
                            ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40'
                            : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <Star className={`w-4 h-4 ${task.isTopPriority ? 'fill-current' : ''}`} />
                      </button>

                      {!task.completed && task.scheduledHour == null && (
                        <button
                          type="button"
                          onClick={() => onScheduleTodayNextOpen(task.id)}
                          title="Schedule into next open slot today"
                          aria-label={`Schedule ${task.title} today`}
                          className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <CalendarPlus className="w-4 h-4" />
                        </button>
                      )}

                      {!task.completed && (
                        <button
                          type="button"
                          onClick={() => onStartFocusOnTask(task)}
                          title="Start Focus Session"
                          aria-label={`Focus on ${task.title}`}
                          className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                        >
                          <Play className="w-4 h-4 fill-current" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onEditTask(task)}
                        title="Edit Task"
                        aria-label={`Edit ${task.title}`}
                        className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeleteTask(task.id)}
                        title="Delete Task"
                        aria-label={`Delete ${task.title}`}
                        className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Subtasks & Notes */}
                  {isExpanded && (
                    <div className="px-5 pb-4 pl-14 space-y-3">
                      {task.notes && (
                        <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                          {task.notes}
                        </p>
                      )}

                      {task.subtasks.length > 0 && (
                        <div className="space-y-1.5">
                          {task.subtasks.map((sub) => (
                            <label
                              key={sub.id}
                              className="flex items-center gap-2.5 min-h-[36px] cursor-pointer text-xs text-slate-700 dark:text-slate-300"
                            >
                              <input
                                type="checkbox"
                                checked={sub.completed}
                                onChange={() => onToggleSubtask(task.id, sub.id)}
                                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                              />
                              <span className={sub.completed ? 'line-through text-slate-400' : ''}>
                                {sub.title}
                              </span>
                            </label>
                          ))}
                        </div>
                      )}

                      <form
                        onSubmit={(e) => handleSubtaskSubmit(e, task.id)}
                        className="flex items-center gap-2 max-w-md"
                      >
                        <input
                          type="text"
                          value={subtaskDrafts[task.id] || ''}
                          onChange={(e) =>
                            setSubtaskDrafts((prev) => ({
                              ...prev,
                              [task.id]: e.target.value,
                            }))
                          }
                          placeholder="Add checklist step..."
                          className="flex-1 min-h-[38px] px-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                        <button
                          type="submit"
                          className="min-h-[38px] px-3 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-medium hover:opacity-90 transition-opacity whitespace-nowrap"
                        >
                          Add Step
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
