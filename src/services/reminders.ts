import { Platform } from 'react-native';
import { StudyRecord } from '../domain/models';
import { timeMinutes } from '../domain/planner';

let notificationApi: Promise<typeof import('./localNotifications')> | undefined;
let handlerInstalled = false;
async function notifications(installHandler = true) {
  notificationApi ??= import('./localNotifications').catch(error => {
    notificationApi = undefined;
    throw error;
  });
  const api = await notificationApi;
  // Cancellation does not need a foreground event listener, especially at sign-out.
  if (installHandler && !handlerInstalled) {
    api.setNotificationHandler({ handleNotification: async () => ({ shouldPlaySound: true, shouldSetBadge: false, shouldShowBanner: true, shouldShowList: true }) });
    handlerInstalled = true;
  }
  return api;
}
export async function requestReminders() {
  if (Platform.OS === 'web') throw new Error('Scheduled reminders are available in the Android and iOS app.');
  const api = await notifications();
  if (Platform.OS === 'android') await api.setNotificationChannelAsync('study', { name: 'Study reminders', importance: api.AndroidImportance.DEFAULT });
  const result = await api.requestPermissionsAsync();
  if (!result.granted) throw new Error('Notifications are disabled. Enable StudyMate notifications in your device settings.');
}
export async function clearReminders() {
  if (Platform.OS === 'web') return;
  const api = await notifications(false);
  if (typeof api.cancelAllScheduledNotificationsAsync !== 'function') {
    throw new Error('The notification cancellation API is unavailable in this app runtime. Restart Expo Go with a cleared Metro cache.');
  }
  await api.cancelAllScheduledNotificationsAsync();
}
export async function cancelFocusReminder() {
  if (Platform.OS !== 'web') await (await notifications(false)).cancelScheduledNotificationAsync('focus-timer');
}
export async function scheduleFocusReminder(endAt: number, mode: string) {
  if (Platform.OS === 'web') return;
  const api = await notifications();
  await api.cancelScheduledNotificationAsync('focus-timer');
  if (endAt <= Date.now() || !(await api.getPermissionsAsync()).granted) return;
  await api.scheduleNotificationAsync({ identifier: 'focus-timer', content: { title: mode === 'focus' ? 'Your focus session is complete' : 'Ready for a fresh start?', body: 'Open StudyMate to save your progress and choose your next step.', sound: true }, trigger: { type: api.SchedulableTriggerInputTypes.DATE, date: new Date(endAt), channelId: 'study' } });
}

/** Reconcile only changed reminders, keeping within the iOS pending-notification limit. */
export async function reconcileReminders(uid: string, records: StudyRecord[], enabled: boolean) {
  if (Platform.OS === 'web') return;
  const api = await notifications(enabled);
  if (!enabled) await api.cancelScheduledNotificationAsync('focus-timer');
  const scheduled = await api.getAllScheduledNotificationsAsync();
  const allowed = enabled && (await api.getPermissionsAsync()).granted;
  const candidates = allowed ? records.filter(r => !r.deleted && !r.completed && r.reminderMinutes !== undefined && r.reminderMinutes >= 0 && ['task', 'exam', 'class'].includes(r.kind))
    .sort((a, b) => (a.dueAt ?? Infinity) - (b.dueAt ?? Infinity)).slice(0, 50) : [];
  const desired = new Map<string, { record: StudyRecord; signature: string }>();
  for (const record of candidates) {
    if (record.kind !== 'class' && (record.dueAt! - record.reminderMinutes! * 60000) <= Date.now()) continue;
    desired.set(`planner:${uid}:${record.id}`, { record, signature: `${record.title}:${record.dueAt}:${record.day}:${record.startTime}:${record.reminderMinutes}` });
  }
  for (const old of scheduled) {
    if (old.identifier.startsWith('planner:') && old.content.data?.signature !== desired.get(old.identifier)?.signature) await api.cancelScheduledNotificationAsync(old.identifier);
  }
  for (const [identifier, { record, signature }] of desired) {
    if (scheduled.some(old => old.identifier === identifier && old.content.data?.signature === signature)) continue;
    let trigger: import('./localNotifications').NotificationTriggerInput;
    if (record.kind === 'class') {
      const total = timeMinutes(record.startTime!) - record.reminderMinutes!;
      const minutes = (total + 1440) % 1440;
      const weekday = ((record.day! + (total < 0 ? -1 : 0) + 7) % 7) + 1;
      trigger = { type: api.SchedulableTriggerInputTypes.WEEKLY, weekday, hour: Math.floor(minutes / 60), minute: minutes % 60, channelId: 'study' };
    } else trigger = { type: api.SchedulableTriggerInputTypes.DATE, date: new Date(record.dueAt! - record.reminderMinutes! * 60000), channelId: 'study' };
    await api.scheduleNotificationAsync({ identifier, content: { title: record.title, body: record.kind === 'class' ? `Your class begins at ${record.startTime}.` : `Your ${record.kind === 'exam' ? 'exam' : 'task'} is coming up. Open StudyMate to prepare.`, data: { signature }, sound: true }, trigger });
  }
}
