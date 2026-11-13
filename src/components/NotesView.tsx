import React, {useMemo, useState} from 'react';
import {
  ArrowRightCircle,
  CheckCircle2,
  Moon,
  Pin,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import {
  DailyReflection,
  PROJECT_AREAS,
  ProjectArea,
  QuickNote,
  TaskItem,
} from '../types/productivity';

interface NotesViewProps {
  notes: QuickNote[];
  tasks: TaskItem[];
  reflection: DailyReflection;
  focusMinutesToday: number;
  onAddNote: (note: Omit<QuickNote, 'id' | 'updatedAt'>) => string;
  onUpdateNote: (id: string, patch: Partial<QuickNote>) => void;
  onDeleteNote: (id: string) => void;
  onConvertNoteToTask: (title: string, project: ProjectArea, notes: string) => void;
  onUpdateReflection: (patch: Partial<DailyReflection>) => void;
}

export const NotesView: React.FC<NotesViewProps> = ({
  notes,
  tasks,
  reflection,
  focusMinutesToday,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  onConvertNoteToTask,
  onUpdateReflection,
}) => {
  const [subTab, setSubTab] = useState<'notes' | 'shutdown'>('notes');
  const [search, setSearch] = useState('');
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(
    notes[0]?.id || null
  );
  const [convertedBanner, setConvertedBanner] = useState<string | null>(null);

  const filteredNotes = useMemo(() => {
    const q = search.trim().toLowerCase();
    return [...notes]
      .filter(
        (n) =>
          !q ||
          n.title.toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q) ||
          n.project.toLowerCase().includes(q)
      )
      .sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
  }, [notes, search]);

  const activeNote = useMemo(
    () => notes.find((n) => n.id === selectedNoteId) || filteredNotes[0] || null,
    [notes, selectedNoteId, filteredNotes]
  );

  const completedToday = useMemo(
    () => tasks.filter((t) => t.completed).length,
    [tasks]
  );

  const handleCreateNote = () => {
    const id = onAddNote({
      title: 'Untitled Capture',
      content: '',
      project: 'Strategy',
      pinned: false,
    });
    setSelectedNoteId(id);
    setSubTab('notes');
  };

  const handleConvert = (note: QuickNote) => {
    const title = note.title.trim() || 'Follow-up action item';
    onConvertNoteToTask(title, note.project, note.content);
    setConvertedBanner(`Added "${title}" to your Tasks queue.`);
    setTimeout(() => setConvertedBanner(null), 3500);
  };

  return (
    <div className="space-y-5">
      {/* Sub-navigation between Scratchpad Notes & Evening Shutdown */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-slate-200/70 dark:bg-slate-800/80">
          <button
            type="button"
            onClick={() => setSubTab('notes')}
            className={`min-h-[38px] px-4 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              subTab === 'notes'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Quick Capture Notes
          </button>
          <button
            type="button"
            onClick={() => setSubTab('shutdown')}
            className={`min-h-[38px] px-4 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              subTab === 'shutdown'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Daily Shutdown Ritual
          </button>
        </div>

        {subTab === 'notes' && (
          <button
            type="button"
            onClick={handleCreateNote}
            className="inline-flex items-center gap-1.5 min-h-[40px] px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>New Note</span>
          </button>
        )}
      </div>

      {convertedBanner && (
        <div
          role="status"
          className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 px-4 py-3 text-xs font-medium text-emerald-800 dark:text-emerald-200"
        >
          {convertedBanner}
        </div>
      )}

      {subTab === 'notes' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Notes Sidebar List */}
          <section className="lg:col-span-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
            <div className="p-3.5 border-b border-slate-200 dark:border-slate-800">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter notes..."
                  aria-label="Filter notes"
                  className="w-full min-h-[40px] pl-9 pr-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            {filteredNotes.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400">
                No notes match your search. Create a fresh capture to jot down meeting actions.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 overflow-y-auto max-h-[520px]">
                {filteredNotes.map((note) => {
                  const isActive = activeNote?.id === note.id;
                  return (
                    <button
                      key={note.id}
                      type="button"
                      onClick={() => setSelectedNoteId(note.id)}
                      className={`w-full text-left px-4 py-3.5 transition-colors ${
                        isActive
                          ? 'bg-blue-50/70 dark:bg-blue-950/30'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-slate-900 dark:text-white truncate">
                          {note.title || 'Untitled Note'}
                        </span>
                        {note.pinned && (
                          <Pin className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                        )}
                      </div>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                        {note.content || 'Empty scratchpad...'}
                      </p>
                      <div className="mt-1.5 flex items-center gap-2 text-[11px] text-slate-400 tabular-nums">
                        <span>{note.project}</span>
                        <span aria-hidden="true">·</span>
                        <span>
                          {new Date(note.updatedAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {/* Note Editor */}
          <section className="lg:col-span-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 flex flex-col min-h-[420px]">
            {activeNote ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
                  <select
                    aria-label="Note project area"
                    value={activeNote.project}
                    onChange={(e) =>
                      onUpdateNote(activeNote.id, {
                        project: e.target.value as ProjectArea,
                      })
                    }
                    className="min-h-[38px] px-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    {PROJECT_AREAS.map((area) => (
                      <option key={area} value={area}>
                        {area}
                      </option>
                    ))}
                  </select>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateNote(activeNote.id, {pinned: !activeNote.pinned})
                      }
                      className={`inline-flex items-center gap-1.5 min-h-[38px] px-3 rounded-lg text-xs font-medium border transition-colors ${
                        activeNote.pinned
                          ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Pin className="w-3.5 h-3.5" />
                      <span>{activeNote.pinned ? 'Pinned' : 'Pin'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleConvert(activeNote)}
                      className="inline-flex items-center gap-1.5 min-h-[38px] px-3 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-medium hover:opacity-90 transition-opacity whitespace-nowrap"
                    >
                      <ArrowRightCircle className="w-3.5 h-3.5" />
                      <span>Create Task</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onDeleteNote(activeNote.id);
                        setSelectedNoteId(null);
                      }}
                      aria-label="Delete note"
                      className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <input
                  type="text"
                  value={activeNote.title}
                  onChange={(e) =>
                    onUpdateNote(activeNote.id, {title: e.target.value})
                  }
                  placeholder="Note headline..."
                  aria-label="Note title"
                  className="mt-4 w-full bg-transparent text-xl font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none font-display"
                />

                <textarea
                  value={activeNote.content}
                  onChange={(e) =>
                    onUpdateNote(activeNote.id, {content: e.target.value})
                  }
                  placeholder="Capture meeting notes, decisions, code snippets, or open loops..."
                  aria-label="Note body"
                  className="mt-4 flex-1 w-full min-h-[260px] bg-transparent text-sm leading-relaxed text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:outline-none resize-none"
                />
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  Select a note or start a new capture
                </p>
                <button
                  type="button"
                  onClick={handleCreateNote}
                  className="mt-3 inline-flex items-center gap-1.5 min-h-[40px] px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Capture</span>
                </button>
              </div>
            )}
          </section>
        </div>
      ) : (
        /* Evening Shutdown Ritual */
        <section className="max-w-3xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                <Moon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>End-of-Day Closure</span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">{completedToday} tasks closed</span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">{focusMinutesToday}m focused today</span>
              </div>
              <h2 className="mt-2 text-xl font-semibold text-slate-900 dark:text-white font-display">
                Daily Shutdown &amp; Tomorrow&apos;s Anchor
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Close cognitive loops cleanly at the end of your workday so tomorrow begins with clarity.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="shutdown-win"
                className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5"
              >
                Today&apos;s Key Win or Progress
              </label>
              <textarea
                id="shutdown-win"
                rows={3}
                value={reflection.dailyWin}
                onChange={(e) => onUpdateReflection({dailyWin: e.target.value})}
                placeholder="What shipped, unblocked a teammate, or moved the needle today?"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
              />
            </div>

            <div>
              <label
                htmlFor="shutdown-tomorrow"
                className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5"
              >
                Tomorrow&apos;s #1 Morning Intention
              </label>
              <input
                id="shutdown-tomorrow"
                type="text"
                value={reflection.tomorrowTopFocus}
                onChange={(e) =>
                  onUpdateReflection({tomorrowTopFocus: e.target.value})
                }
                placeholder="First deep work deliverable at 9:00 AM tomorrow..."
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {reflection.shutdownCompleted
                ? 'Shutdown logged for today — ready to disconnect.'
                : 'Mark shutdown complete once your inbox and schedule are settled.'}
            </span>
            <button
              type="button"
              onClick={() =>
                onUpdateReflection({
                  shutdownCompleted: !reflection.shutdownCompleted,
                })
              }
              className={`inline-flex items-center gap-2 min-h-[44px] px-5 py-2 rounded-xl text-sm font-semibold transition-colors ${
                reflection.shutdownCompleted
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {reflection.shutdownCompleted
                  ? 'Shutdown Completed'
                  : 'Complete Workday Shutdown'}
              </span>
            </button>
          </div>
        </section>
      )}
    </div>
  );
};
