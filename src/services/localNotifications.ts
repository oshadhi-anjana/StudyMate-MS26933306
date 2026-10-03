/**
 * SDK 57 local-notification adapter.
 *
 * Importing the package root also loads DevicePushTokenAutoRegistration.fx,
 * which reports an unsupported remote-push error in Android Expo Go.
 * StudyMate needs local scheduling only. Keep these SDK-specific imports here
 * and run the notification import-graph regression test after SDK upgrades.
 */
export { setNotificationHandler } from 'expo-notifications/build/NotificationsHandler';
export { getPermissionsAsync, requestPermissionsAsync } from 'expo-notifications/build/NotificationPermissions';
export { setNotificationChannelAsync } from 'expo-notifications/build/setNotificationChannelAsync';
export { getAllScheduledNotificationsAsync } from 'expo-notifications/build/getAllScheduledNotificationsAsync';
export { scheduleNotificationAsync } from 'expo-notifications/build/scheduleNotificationAsync';
export { cancelScheduledNotificationAsync } from 'expo-notifications/build/cancelScheduledNotificationAsync';
export { cancelAllScheduledNotificationsAsync } from 'expo-notifications/build/cancelAllScheduledNotificationsAsync';
export { AndroidImportance } from 'expo-notifications/build/NotificationChannelManager.types';
export { SchedulableTriggerInputTypes } from 'expo-notifications/build/Notifications.types';
export type { NotificationTriggerInput } from 'expo-notifications/build/Notifications.types';
