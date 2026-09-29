/** Notification cleanup must not keep a student signed in. Auth failures still propagate. */
export async function completeSignOut(
  clearReminders: () => Promise<void>,
  endSession: () => Promise<void>,
): Promise<unknown | undefined> {
  let cleanupError: unknown;
  try {
    await clearReminders();
  } catch (error) {
    cleanupError = error;
  }
  await endSession();
  return cleanupError;
}
