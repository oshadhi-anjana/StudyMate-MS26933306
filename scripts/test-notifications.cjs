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
