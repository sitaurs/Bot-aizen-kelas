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
}


