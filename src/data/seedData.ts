import {WorkspaceData} from '../types/productivity';

const STORAGE_KEY = 'cadence_workspace_v1';

export function getTodayDateKey(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function isoAtDaysAgo(daysAgo: number, hour: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, 15, 0, 0);
  return d.toISOString();
}

export function createSeedWorkspace(): WorkspaceData {
  const todayKey = getTodayDateKey(0);

  return {
    tasks: [
      {
        id: 't-101',
        title: 'Finalize Q4 Architecture Proposal & Rollout Milestones',
        notes: 'Include latency benchmarks and phased migration timeline before executive review.',
        project: 'Strategy',
        priority: 'urgent',
        estimatedMinutes: 60,
        loggedFocusMinutes: 25,
        dueBucket: 'Today',
        scheduledHour: 9,
        isTopPriority: true,
        completed: false,
        completedAt: null,
        createdAt: isoAtDaysAgo(1, 10),
        subtasks: [
          {id: 'st-1', title: 'Review cost model assumptions', completed: true},
          {id: 'st-2', title: 'Draft executive summary slide', completed: false},
          {id: 'st-3', title: 'Send pre-read link to stakeholders', completed: false},
        ],
      },
      {
        id: 't-102',
        title: 'Ship API Rate Limiter & Auth Middleware Refactor',
        notes: 'Verify token bucket edge cases and integration tests.',
        project: 'Engineering',
        priority: 'high',
        estimatedMinutes: 90,
        loggedFocusMinutes: 50,
        dueBucket: 'Today',
        scheduledHour: 11,
        isTopPriority: true,
        completed: false,
        completedAt: null,
        createdAt: isoAtDaysAgo(2, 9),
        subtasks: [
          {id: 'st-4', title: 'Add sliding window unit tests', completed: true},
          {id: 'st-5', title: 'Run load test against staging', completed: false},
        ],
      },
      {
        id: 't-103',
        title: 'Prepare Client Discovery Brief — Northstar Logistics',
        notes: 'Synthesize interview notes and workflow bottlenecks.',
        project: 'Client Work',
        priority: 'high',
        estimatedMinutes: 45,
        loggedFocusMinutes: 0,
        dueBucket: 'Today',
        scheduledHour: 14,
        isTopPriority: true,
        completed: false,
        completedAt: null,
        createdAt: isoAtDaysAgo(1, 16),
        subtasks: [],
      },
      {
        id: 't-104',
        title: 'Clear Vendor Invoices & Monthly Expense Reconciliation',
        project: 'Operations',
        priority: 'normal',
        estimatedMinutes: 30,
        loggedFocusMinutes: 30,
        dueBucket: 'Today',
        scheduledHour: 16,
        isTopPriority: false,
        completed: true,
        completedAt: isoAtDaysAgo(0, 8),
        createdAt: isoAtDaysAgo(2, 14),
        subtasks: [],
      },
      {
        id: 't-105',
        title: 'Audit Onboarding Flow Copy & Accessibility Contrast',
        project: 'Client Work',
        priority: 'normal',
        estimatedMinutes: 45,
        loggedFocusMinutes: 0,
        dueBucket: 'Tomorrow',
        scheduledHour: null,
        isTopPriority: false,
        completed: false,
        completedAt: null,
        createdAt: isoAtDaysAgo(1, 11),
        subtasks: [
          {id: 'st-6', title: 'Check keyboard tab order', completed: false},
          {id: 'st-7', title: 'Verify screen reader aria-labels', completed: false},
        ],
      },
      {
        id: 't-106',
        title: 'Schedule Annual Dental Checkup & Travel Insurance Renewal',
        project: 'Personal',
        priority: 'low',
        estimatedMinutes: 15,
        loggedFocusMinutes: 0,
        dueBucket: 'This Week',
        scheduledHour: null,
        isTopPriority: false,
        completed: false,
        completedAt: null,
        createdAt: isoAtDaysAgo(3, 19),
        subtasks: [],
      },
    ],
    sessions: [
      {
        id: 's-1',
        taskId: 't-102',
        taskTitle: 'Ship API Rate Limiter & Auth Middleware Refactor',
        project: 'Engineering',
        durationMinutes: 50,
        mode: 'deep',
        completedAt: isoAtDaysAgo(0, 10),
      },
      {
        id: 's-2',
        taskId: 't-104',
        taskTitle: 'Clear Vendor Invoices & Monthly Expense Reconciliation',
        project: 'Operations',
        durationMinutes: 25,
        mode: 'pomodoro',
        completedAt: isoAtDaysAgo(0, 8),
      },
      {
        id: 's-3',
        taskId: null,
        taskTitle: 'Weekly Architecture Review Prep',
        project: 'Strategy',
        durationMinutes: 50,
        mode: 'deep',
        completedAt: isoAtDaysAgo(1, 15),
      },
      {
        id: 's-4',
        taskId: null,
        taskTitle: 'Client Prototype Walkthrough',
        project: 'Client Work',
        durationMinutes: 45,
        mode: 'deep',
        completedAt: isoAtDaysAgo(1, 11),
      },
      {
        id: 's-5',
        taskId: null,
        taskTitle: 'Core Service Telemetry Upgrade',
        project: 'Engineering',
        durationMinutes: 75,
        mode: 'deep',
        completedAt: isoAtDaysAgo(2, 14),
      },
      {
        id: 's-6',
        taskId: null,
        taskTitle: 'Quarterly Budget Forecasting',
        project: 'Operations',
        durationMinutes: 40,
        mode: 'pomodoro',
        completedAt: isoAtDaysAgo(3, 10),
      },
      {
        id: 's-7',
        taskId: null,
        taskTitle: 'Deep Reading & Industry Benchmark Notes',
        project: 'Strategy',
        durationMinutes: 50,
        mode: 'deep',
        completedAt: isoAtDaysAgo(4, 9),
      },
    ],
    notes: [
      {
        id: 'n-1',
        title: 'Northstar Discovery Call — Key Takeaways',
        content:
          '1. Dispatch team loses ~45 mins every morning reconciling spreadsheet handoffs.\n2. Mobile drivers need offline-capable checklist confirmation.\n3. Target pilot kickoff: first Monday next month.\n\nNext step: Send scoped workflow diagram by 4 PM.',
        project: 'Client Work',
        pinned: true,
        updatedAt: isoAtDaysAgo(0, 9),
      },
      {
        id: 'n-2',
        title: 'Deep Work Guardrails',
        content:
          '- Batch Slack & email checks at 11:30 AM and 4:00 PM.\n- Protect 9:00–11:00 AM daily for highest-leverage cognitive work.\n- End every day with a 3-minute shutdown review so tomorrow starts friction-free.',
        project: 'Personal',
        pinned: true,
        updatedAt: isoAtDaysAgo(2, 18),
      },
      {
        id: 'n-3',
        title: 'Q4 Latency & Reliability Targets',
        content:
          'Target p95 API response under 120ms across core endpoints. Automated canary checks run on every release branch before production promotion.',
        project: 'Engineering',
        pinned: false,
        updatedAt: isoAtDaysAgo(3, 13),
      },
    ],
    reflection: {
      dateKey: todayKey,
      morningIntention: 'Protect morning deep-work blocks and ship the Q4 proposal before 3 PM.',
      dailyWin: '',
      tomorrowTopFocus: '',
      shutdownCompleted: false,
    },
  };
}

export function loadWorkspace(): WorkspaceData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createSeedWorkspace();
    const parsed = JSON.parse(raw) as WorkspaceData;
    const todayKey = getTodayDateKey(0);
    if (!parsed.reflection || parsed.reflection.dateKey !== todayKey) {
      return {
        ...parsed,
        reflection: {
          dateKey: todayKey,
          morningIntention: parsed.reflection?.tomorrowTopFocus || '',
          dailyWin: '',
          tomorrowTopFocus: '',
          shutdownCompleted: false,
        },
      };
    }
    return parsed;
  } catch {
    return createSeedWorkspace();
  }
}

export function saveWorkspace(data: WorkspaceData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Storage quota exceeded or unavailable
  }
}

export function resetWorkspace(): WorkspaceData {
  const seed = createSeedWorkspace();
  saveWorkspace(seed);
  return seed;
}
