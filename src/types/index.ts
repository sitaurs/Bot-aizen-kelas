// WhatsApp Types
export interface WhatsAppMessage {
  key: {
    remoteJid: string;
    fromMe: boolean;
    participant?: string;
  };
  message: any;
  messageTimestamp: number;
}

export interface WhatsAppConnection {
  connection: 'open' | 'close' | 'connecting';
  lastDisconnect?: {
    error: any;
  };
  qr?: string;
}

// Schedule Types
export interface ClassSchedule {
  course: string;
  start: string;
  end: string;
  room: string;
  lecturerId: string;
}

export interface ScheduleOverride {
  date: string;
  course: string;
  start: string;
  end: string;
  room?: string;
  reason: string;
}

export interface ScheduleData {
  timezone: string;
  days: {
    Mon: ClassSchedule[];
    Tue: ClassSchedule[];
    Wed: ClassSchedule[];
    Thu: ClassSchedule[];
    Fri: ClassSchedule[];
    Sat: ClassSchedule[];
    Sun: ClassSchedule[];
  };
  overrides: ScheduleOverride[];
}

// Academic Calendar Types
export interface AcademicEvent {
  id: string;
  title: string;
  date: string;
  type: 'holiday' | 'exam' | 'deadline' | 'event';
  description?: string;
}

// Lecturer Types
export interface Lecturer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  courses?: string[];
}

// Reminder Types
export interface Reminder {
  id: string;
  type: 'task' | 'exam' | 'cash' | 'item';
  title: string;
  course?: string;
  dueISO: string;
  notes?: string;
  completed?: boolean;
}

// Exam Types
export interface Exam {
  id: string;
  course: string;
  type: 'UTS' | 'UAS' | 'Quiz';
  dateISO: string;
  start: string;
  end: string;
  room?: string;
  notes?: string;
}

// Cash Reminder Types
export interface CashReminder {
  id: string;
  amount: number;
  dueISO: string;
  notes?: string;
  paid?: boolean;
}

// Items Types
export interface CarryItems {
  [course: string]: string[];
}

// Materials Types
export interface MaterialFile {
  path: string;
  filename: string;
  mime: string;
  size?: number;
}

export interface MaterialEntry {
  id: string;
  course: string;
  dateISO: string;
  captions: string[];
  files: MaterialFile[];
  createdAt: string;
}

export interface MaterialsData {
  byDate: {
    [date: string]: MaterialEntry[];
  };
}

// Context Types
export interface ChatContext {
  jid: string;
  lastMessage: string;
  pendingAction?: {
    type: string;
    params: Record<string, any>;
  };
  timestamp: number;
}

export interface ContextData {
  [jid: string]: ChatContext;
}

// Health Types
export interface HydrationPlan {
  dailyGoalMl: number;
  glassSizeMl: number;
  reminders: string[];
}

// AI Function Call Types
export interface FunctionCall {
  name: string;
  args: Record<string, any>;
}

export interface FunctionResponse {
  name: string;
  response: any;
}

// Bot Configuration
export interface BotConfig {
  name: string;
  triggers: string[];
  groupJid?: string;
  noteTakers: string[];
  hydrationPlan: HydrationPlan;
}

// Storage Types
export interface StorageInterface {
  saveFile(course: string, date: string, filename: string, buffer: Buffer, mime: string): Promise<string>;
  getFile(path: string): Promise<Buffer>;
  deleteFile(path: string): Promise<boolean>;
}

// Error Types
export class BotError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'BotError';
  }
}
