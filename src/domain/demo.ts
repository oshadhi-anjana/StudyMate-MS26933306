import { emptyState, LocalState, StudyRecord } from './models';
export function demoState(now = Date.now()): LocalState {
  const dateAt = (offset: number, hour: number) => { const date = new Date(now); date.setDate(date.getDate() + offset); date.setHours(hour, 0, 0, 0); return date.getTime(); };
  const rows: Omit<StudyRecord, 'updatedAt' | 'revision'>[] = [
    { id: 'profile', kind: 'profile', title: 'Oshadhi', dailyMinutes: 120, focusMinutes: 25, breakMinutes: 5, availableStart: '16:00', availableEnd: '22:00', remindersEnabled: false },
    { id: 'mobility', kind: 'subject', title: 'Enterprise Mobility', color: '#176B58', body: 'Building thoughtful mobile experiences.' },
    { id: 'database', kind: 'subject', title: 'Database Systems', color: '#B27816' },
    { id: 'software', kind: 'subject', title: 'Software Architecture', color: '#716098' },
    { id: 'task-1', kind: 'task', title: 'Sketch the StudyMate user journey', subjectId: 'mobility', dueAt: dateAt(1, 18), estimatedMinutes: 60, priority: 'high', completed: false, subtasks: [{ id: 'step1', title: 'Map the main screens', done: true }, { id: 'step2', title: 'Draw the offline experience', done: false }] },
    { id: 'task-2', kind: 'task', title: 'Practise SQL joins and subqueries', subjectId: 'database', dueAt: dateAt(2, 17), estimatedMinutes: 45, priority: 'medium', completed: false },
    { id: 'task-3', kind: 'task', title: 'Read about layered architecture', subjectId: 'software', dueAt: dateAt(3, 19), estimatedMinutes: 30, priority: 'low', completed: false },
    { id: 'class-1', kind: 'class', title: 'Mobile application development', subjectId: 'mobility', day: new Date(now).getDay(), startTime: '09:00', endTime: '11:00', location: 'Lecture hall B' },
    { id: 'class-2', kind: 'class', title: 'Database practical', subjectId: 'database', day: new Date(now).getDay(), startTime: '14:00', endTime: '15:30', location: 'Computer lab 02' },
    { id: 'exam-1', kind: 'exam', title: 'Enterprise Mobility assessment', subjectId: 'mobility', dueAt: dateAt(12, 9), location: 'Main examination hall', subtasks: [{ id: 'topic1', title: 'Offline storage and sync', done: false }, { id: 'topic2', title: 'Native hardware integration', done: false }, { id: 'topic3', title: 'Reusable components', done: true }] },
    { id: 'goal-1', kind: 'goal', title: 'Make time for mobile development', subjectId: 'mobility', date: dateAt(-3, 0), dueAt: dateAt(4, 23), targetMinutes: 240 },
    { id: 'note-1', kind: 'note', title: 'A good offline experience', subjectId: 'mobility', body: 'Save the student’s work on the device first. Show whether changes are pending or synced. Keep retries safe, so sending the same change twice does not create duplicate work.' },
    { id: 'session-1', kind: 'session', title: 'Focus session', subjectId: 'mobility', date: dateAt(0, 8), minutes: 25 },
    { id: 'session-2', kind: 'session', title: 'Focus session', subjectId: 'database', date: dateAt(0, 10), minutes: 25 },
    { id: 'session-3', kind: 'session', title: 'Focus session', subjectId: 'mobility', date: dateAt(-1, 18), minutes: 50 },
    { id: 'session-4', kind: 'session', title: 'Focus session', subjectId: 'software', date: dateAt(-2, 18), minutes: 25 },
  ];
  return { ...emptyState(), records: Object.fromEntries(rows.map(row => [row.id, { ...row, updatedAt: now, revision: 'demo-initial' }])) };
}
