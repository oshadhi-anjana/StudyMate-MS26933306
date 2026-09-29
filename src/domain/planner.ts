import type { StudyRecord } from './models';

export const timeMinutes = (value: string) => {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
};
export const validTime = (value: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
export const dayStart = (date = new Date()) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
export const weekStart = (now = Date.now()) => {
  const date = new Date(now);
  date.setDate(date.getDate() - (date.getDay() + 6) % 7);
  return dayStart(date);
};
export const daysUntil = (date: number, now = Date.now()) => Math.round((dayStart(new Date(date)) - dayStart(new Date(now))) / 86400000);
export const dateLabel = (date?: number) => date ? new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'No date';
export const clockLabel = (date?: number) => date ? new Date(date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : '';

export function clash(candidate: StudyRecord, records: StudyRecord[]) {
  if (candidate.kind !== 'class') return undefined;
  return records.find(record => record.kind === 'class' && !record.deleted && record.id !== candidate.id &&
    record.day === candidate.day && timeMinutes(candidate.startTime!) < timeMinutes(record.endTime!) &&
    timeMinutes(candidate.endTime!) > timeMinutes(record.startTime!));
}

export function rankedTasks(records: StudyRecord[], now = Date.now()) {
  const score = (record: StudyRecord) => {
    const hours = ((record.dueAt ?? now + 30 * 86400000) - now) / 3600000;
    return ({ high: 30, medium: 15, low: 0 }[record.priority ?? 'medium']) +
      (hours < 0 ? 100 : 80 / (1 + hours / 24)) + Math.min(20, (record.estimatedMinutes ?? 30) / 15);
  };
  return records.filter(record => record.kind === 'task' && !record.completed && !record.deleted)
    .sort((a, b) => score(b) - score(a) || (a.dueAt ?? Infinity) - (b.dueAt ?? Infinity) || a.id.localeCompare(b.id));
}

/** Finds a contiguous free block today; never overlaps a class or the current time. */
export function suggestSlot(records: StudyRecord[], duration: number, start = '17:00', end = '21:00', now = Date.now()) {
  const date = new Date(now);
  const finish = timeMinutes(end);
  let cursor = Math.max(timeMinutes(start), Math.ceil((date.getHours() * 60 + date.getMinutes()) / 5) * 5);
  const occupied = records.filter(record => record.kind === 'class' && record.day === date.getDay() && !record.deleted)
    .sort((a, b) => timeMinutes(a.startTime!) - timeMinutes(b.startTime!));
  for (const record of occupied) {
    const from = timeMinutes(record.startTime!);
    const to = timeMinutes(record.endTime!);
    if (to <= cursor) continue;
    if (cursor + duration <= Math.min(from, finish)) break;
    if (from < cursor + duration) cursor = to;
  }
  if (cursor + duration > finish) return null;
  const at = new Date(now);
  at.setHours(Math.floor(cursor / 60), cursor % 60, 0, 0);
  return at.getTime();
}

export function studyMinutes(records: StudyRecord[], since: number, subjectId?: string, until = Infinity) {
  return records.filter(record => record.kind === 'session' && !record.deleted && (record.date ?? 0) >= since &&
    (record.date ?? 0) < until && (!subjectId || record.subjectId === subjectId)).reduce((sum, record) => sum + (record.minutes ?? 0), 0);
}

export function studyStreak(records: StudyRecord[], now = Date.now()) {
  const active = new Set(records.filter(r => r.kind === 'session' && !r.deleted && (r.minutes ?? 0) >= 1).map(r => dayStart(new Date(r.date!))));
  const date = new Date(now);
  if (!active.has(dayStart(date))) date.setDate(date.getDate() - 1);
  let count = 0;
  while (active.has(dayStart(date))) { count++; date.setDate(date.getDate() - 1); }
  return count;
}

export function availableStudyMinutes(records: StudyRecord[], start: string, end: string, now = Date.now()) {
  const date = new Date(now);
  let cursor = Math.max(timeMinutes(start), date.getHours() * 60 + date.getMinutes());
  const finish = timeMinutes(end);
  let free = 0;
  for (const record of records.filter(r => r.kind === 'class' && !r.deleted && r.day === date.getDay()).sort((a, b) => timeMinutes(a.startTime!) - timeMinutes(b.startTime!))) {
    const from = Math.min(finish, timeMinutes(record.startTime!));
    const to = Math.min(finish, timeMinutes(record.endTime!));
    if (to <= cursor) continue;
    free += Math.max(0, from - cursor);
    cursor = Math.max(cursor, to);
  }
  return free + Math.max(0, finish - cursor);
}

export function validateRecord(record: StudyRecord, records: StudyRecord[]) {
  if (!record.title.trim()) throw new Error('Please enter a title.');
  if (record.title.length > 120) throw new Error('Keep the title under 120 characters.');
  if ((record.body?.length ?? 0) > 10000) throw new Error('Keep notes under 10,000 characters.');
  if (record.kind === 'class') {
    if (!validTime(record.startTime ?? '') || !validTime(record.endTime ?? '')) throw new Error('Enter times in 24-hour HH:MM format.');
    if (timeMinutes(record.endTime!) <= timeMinutes(record.startTime!)) throw new Error('Class end must be after its start.');
    const conflict = clash(record, records);
    if (conflict) throw new Error(`This overlaps with ${conflict.title}. Choose a different time.`);
  }
  if (['task', 'exam', 'goal'].includes(record.kind) && (!record.dueAt || !Number.isFinite(record.dueAt))) throw new Error('Choose a valid date and time.');
  if (record.kind === 'goal' && (!(record.targetMinutes! > 0) || record.targetMinutes! > 100000)) throw new Error('Set a goal between 1 and 100,000 minutes.');
  if (record.kind === 'goal' && (!Number.isFinite(record.date) || record.date! >= record.dueAt!)) throw new Error('The goal deadline must be after its start.');
  if (record.kind === 'task' && (!(record.estimatedMinutes! > 0) || record.estimatedMinutes! > 10000)) throw new Error('Estimated effort must be between 1 and 10,000 minutes.');
}
