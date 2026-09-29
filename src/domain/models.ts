export type Kind = 'subject' | 'class' | 'task' | 'exam' | 'goal' | 'note' | 'session' | 'profile';
export type Priority = 'low' | 'medium' | 'high';

/** Flat, serializable records make durable offline changes straightforward. */
export interface StudyRecord {
  id: string;
  kind: Kind;
  title: string;
  updatedAt: number;
  revision: string;
  deleted?: boolean;
  subjectId?: string;
  color?: string;
  body?: string;
  dueAt?: number;
  priority?: Priority;
  completed?: boolean;
  estimatedMinutes?: number;
  day?: number;
  startTime?: string;
  endTime?: string;
  location?: string;
  targetMinutes?: number;
  minutes?: number;
  date?: number;
  subtasks?: { id: string; title: string; done: boolean }[];
  photoUri?: string;
  photoURL?: string;
  photoPath?: string;
  photoPending?: boolean;
  reminderMinutes?: number;
  dailyMinutes?: number;
  availableStart?: string;
  availableEnd?: string;
  focusMinutes?: number;
  breakMinutes?: number;
  remindersEnabled?: boolean;
}

export type RecordInput = Omit<StudyRecord, 'id' | 'revision' | 'updatedAt'> & { id?: string };
export interface LocalState {
  version: 1;
  records: Record<string, StudyRecord>;
  pending: Record<string, string>;
  lastSync: number;
  remoteCursor?: number;
}
export const emptyState = (): LocalState => ({ version: 1, records: {}, pending: {}, lastSync: 0 });
export const subjectColors = ['#176B58', '#B27816', '#5967A3', '#B35048', '#8E5D87', '#387D96'];
export const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
