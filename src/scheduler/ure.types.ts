export type ScheduleKind = 'once'|'rrule'|'interval'|'windowed_rrule';

export interface Reminder {
  id: string;
  chatJid: string;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
  text: string;
  audience?: 'group'|'dm';
  tz: 'Asia/Jakarta';

  schedule: {
    kind: ScheduleKind;
    at?: string;
    rrule?: string;
    everyMs?: number;
    start?: string;
    end?: string;
    count?: number;
  };

  status: 'active'|'paused'|'done';
  lastRunAt?: string;
  nextRunAt?: string | null;
  countFired: number;
  meta?: {
    dueAtISO?: string;
    tags?: string[];
    course?: string;
  };
  useTagAll?: boolean;
  broadcastToAllGroups?: boolean; // NEW: untuk broadcast ke semua grup
  
  // T-minus notification support
  tMinus?: {
    enabled: boolean;
    minutesBefore: number; // e.g., 15 for 15 minutes before
    text?: string; // optional custom text for T-minus notification
    lastTMinusFiredAt?: string; // track when T-minus was last sent
  };
}


