const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const assert = require('node:assert/strict');
const { test } = require('node:test');

test('SDK 57 local notification adapter cannot load remote push registration', () => {
  const visited = new Set();
  const forbidden = new Set(['DevicePushTokenAutoRegistration.fx.js', 'TokenEmitter.js', 'getExpoPushTokenAsync.js', 'getDevicePushTokenAsync.js', 'warnOfExpoGoPushUsage.js']);
  function visit(filename) {
    if (visited.has(filename)) return;
    visited.add(filename);
    assert.ok(!forbidden.has(path.basename(filename)), `Remote push side effect reached: ${filename}`);
    const source = fs.readFileSync(filename, 'utf8');
    // Strip type-only imports/exports before inspecting runtime dependencies.
    const javascript = filename.endsWith('.ts')
      ? ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText
      : source;
    const ast = ts.createSourceFile(filename, javascript, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
    for (const statement of ast.statements) {
      if (!ts.isImportDeclaration(statement) && !ts.isExportDeclaration(statement)) continue;
      if (!statement.moduleSpecifier || !ts.isStringLiteral(statement.moduleSpecifier)) continue;
      const specifier = statement.moduleSpecifier.text;
      assert.notEqual(specifier, 'expo-notifications', 'Do not import the remote-enabled package root');
      if (specifier.startsWith('expo-notifications/')) visit(require.resolve(specifier));
      else if (specifier.startsWith('.')) {
        const base = path.resolve(path.dirname(filename), specifier);
        const target = [base + '.android.js', base + '.native.js', base + '.js', base + '/index.js', base].find(file => fs.existsSync(file) && fs.statSync(file).isFile());
        assert.ok(target, `Cannot resolve SDK dependency ${specifier}`);
        visit(target);
      }
    }
  }
  visit(path.resolve(__dirname, '../src/services/localNotifications.ts'));
  assert.ok([...visited].some(file => file.endsWith('scheduleNotificationAsync.js')), 'Local scheduling must remain included');
  assert.ok([...visited].some(file => file.endsWith('NotificationPermissions.js')), 'Permission handling must remain included');
});

test('reminder service loads the local adapter rather than the package root', () => {
  const source = fs.readFileSync(path.resolve(__dirname, '../src/services/reminders.ts'), 'utf8');
  const javascript = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
  assert.match(javascript, /import\(['"]\.\/localNotifications['"]\)/);
  assert.doesNotMatch(javascript, /(?:from\s*|import\s*\(|require\s*\()\s*['"]expo-notifications['"]/);
});

const missingProvider = new Error('java.lang.NullPointerException: null cannot be cast to non-null type expo.modules.notifications.notifications.channels.NotificationsChannelsProvider');
function reminderHarness({ os = 'android', expoGo = true, channelError, granted = true } = {}) {
  const calls = { channels: 0, permissions: 0, scheduled: [], cancelled: [] };
  const api = {
    setNotificationHandler() {},
    AndroidImportance: { HIGH: 4 },
    SchedulableTriggerInputTypes: { DATE: 'date', WEEKLY: 'weekly', TIME_INTERVAL: 'timeInterval' },
    async setNotificationChannelAsync() { calls.channels++; if (channelError) throw channelError; },
    async requestPermissionsAsync() { calls.permissions++; return { granted }; },
    async getPermissionsAsync() { return { granted }; },
    async getAllScheduledNotificationsAsync() { return []; },
    async cancelScheduledNotificationAsync(id) { calls.cancelled.push(id); },
    async cancelAllScheduledNotificationsAsync() {},
    async scheduleNotificationAsync(request) { calls.scheduled.push(request); return request.identifier; },
  };
  const modules = {
    'react-native': { Platform: { OS: os } },
    'expo-constants': { __esModule: true, default: { executionEnvironment: expoGo ? 'storeClient' : 'standalone' }, ExecutionEnvironment: { StoreClient: 'storeClient' } },
    './localNotifications': api,
    '../domain/planner': { timeMinutes: value => value.split(':').reduce((hours, minutes) => +hours * 60 + +minutes) },
  };
  const javascript = ts.transpileModule(fs.readFileSync(path.resolve(__dirname, '../src/services/reminders.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const service = {};
  new Function('require', 'exports', javascript)(name => { assert.ok(modules[name], `Unexpected dependency ${name}`); return modules[name]; }, service);
  return { service, calls };
}

test('Expo Go missing channel provider falls back for test, focus, task, and weekly reminders', async () => {
  const { service, calls } = reminderHarness({ channelError: missingProvider });
  await service.testReminder();
  await service.scheduleFocusReminder(Date.now() + 60000, 'focus');
  await service.reconcileReminders('student', [
    { id: 'task', kind: 'task', title: 'Essay', dueAt: Date.now() + 3600000, reminderMinutes: 10 },
    { id: 'class', kind: 'class', title: 'Lecture', day: 1, startTime: '00:10', reminderMinutes: 30 },
  ], true);
  assert.equal(calls.channels, 1);
  assert.equal(calls.permissions, 1);
  assert.equal(calls.scheduled.length, 4);
  assert.ok(calls.scheduled.every(item => !Object.hasOwn(item.trigger, 'channelId')));
  assert.equal(calls.scheduled[0].trigger.seconds, 10);
  assert.deepEqual(calls.scheduled[3].trigger, { type: 'weekly', weekday: 1, hour: 23, minute: 40 });
});

test('normal Android scheduling creates and uses the study channel without an enable-button visit', async () => {
  const { service, calls } = reminderHarness({ expoGo: false });
  await service.scheduleFocusReminder(Date.now() + 60000, 'focus');
  assert.equal(calls.channels, 1);
  assert.equal(calls.scheduled[0].trigger.channelId, 'study');
});

test('unrelated channel errors are not swallowed and setup can retry', async () => {
  const failure = new Error('Android channel creation failed');
  const { service, calls } = reminderHarness({ channelError: failure });
  await assert.rejects(service.requestReminders(), failure);
  await assert.rejects(service.requestReminders(), failure);
  assert.equal(calls.channels, 2);
  assert.equal(calls.permissions, 0);
});

test('missing provider in an installed build remains a visible error', async () => {
  const { service } = reminderHarness({ expoGo: false, channelError: missingProvider });
  await assert.rejects(service.requestReminders(), missingProvider);
});

test('denied permissions do not schedule a test notification', async () => {
  const { service, calls } = reminderHarness({ granted: false, channelError: missingProvider });
  await assert.rejects(service.testReminder(), /Enable Expo Go notifications/);
  assert.equal(calls.scheduled.length, 0);
});

test('iOS never creates an Android channel', async () => {
  const { service, calls } = reminderHarness({ os: 'ios' });
  await service.testReminder();
  assert.equal(calls.channels, 0);
  assert.equal(calls.scheduled.length, 1);
});

test('disabling reminders cancels the test and focus notifications without creating channels', async () => {
  const { service, calls } = reminderHarness();
  await service.reconcileReminders('student', [], false);
  assert.deepEqual(calls.cancelled, ['focus-timer', 'reminder-test']);
  assert.equal(calls.channels, 0);
});
