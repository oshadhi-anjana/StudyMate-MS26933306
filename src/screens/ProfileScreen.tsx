import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../services/auth';
import { useStudy } from '../state/StudyProvider';
import { Button, Card, ConfirmDialog, Field, Message } from '../components/study/Controls';
import { palette as p, ui } from '../components/study/theme';
import { friendlyError } from '../services/errors';
import { requestReminders } from '../services/reminders';
import { validTime, timeMinutes } from '../domain/planner';

export function ProfileScreen() {
  const { user, demo, profile, save, logout, pending, lastSync, sync, syncing } = useStudy();
  const [name, setName] = useState(profile?.title || user?.displayName || '');
  const [daily, setDaily] = useState(String(profile?.dailyMinutes ?? 120));
  const [focus, setFocus] = useState(String(profile?.focusMinutes ?? 25));
  const [rest, setRest] = useState(String(profile?.breakMinutes ?? 5));
  const [start, setStart] = useState(profile?.availableStart ?? '17:00'); const [end, setEnd] = useState(profile?.availableEnd ?? '21:00');
  const [error, setError] = useState(''); const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false); const [confirmLogout, setConfirmLogout] = useState(false);
  const run = (operation: () => Promise<void>) => { setBusy(true); setError(''); setMessage(''); void operation().catch(e => setError(friendlyError(e))).finally(() => setBusy(false)); };
  const savePreferences = async () => {
    if (!name.trim()) throw new Error('Please enter your name.');
    if (![daily, focus, rest].every(value => /^\d+$/.test(value))) throw new Error('Enter whole minutes for your preferences.');
    if (+daily < 1 || +daily > 1440 || +focus < 1 || +focus > 180 || +rest < 1 || +rest > 60) throw new Error('Use 1–1440 daily minutes, 1–180 focus minutes, and 1–60 break minutes.');
    if (!validTime(start) || !validTime(end) || timeMinutes(end) <= timeMinutes(start)) throw new Error('Enter a same-day study window in HH:MM format, with the end after the start.');
    await save({ ...profile, id: 'profile', kind: 'profile', title: name.trim(), dailyMinutes: +daily, focusMinutes: +focus, breakMinutes: +rest, availableStart: start, availableEnd: end });
    setMessage('Preferences saved. Reset an existing timer to use the new session duration.');
  };
  return <View style={{ gap: 22 }}><View style={{ gap: 6 }}><Text style={ui.eyebrow}>MAKE THIS SPACE YOURS</Text><Text style={ui.title}>Your profile & preferences</Text><Text style={ui.muted}>A study rhythm that works for you.</Text></View>
    <Card><View style={ui.row}><View style={{ width: 60, height: 60, backgroundColor: p.mint, borderRadius: 22, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: p.primary, fontSize: 25, fontWeight: '700' }}>{(name || user?.email || 'S')[0].toUpperCase()}</Text></View><View><Text style={ui.heading}>{profile?.title || user?.displayName || 'StudyMate student'}</Text><Text style={ui.muted}>{user?.email}</Text></View></View></Card>
    <Card><Text style={ui.heading}>Your study rhythm</Text><Field label="Display name" value={name} onChangeText={setName} maxLength={80} /><Field label="Daily study target (minutes)" value={daily} onChangeText={setDaily} keyboardType="numeric" /><View style={ui.row}><View style={ui.grow}><Field label="Focus duration (minutes)" value={focus} onChangeText={setFocus} keyboardType="numeric" /></View><View style={ui.grow}><Field label="Break duration (minutes)" value={rest} onChangeText={setRest} keyboardType="numeric" /></View></View><Text style={ui.muted}>Your preferred study window helps us find free time around your classes.</Text><View style={ui.row}><View style={ui.grow}><Field label="Available from (HH:MM)" value={start} onChangeText={setStart} maxLength={5} /></View><View style={ui.grow}><Field label="Available until (HH:MM)" value={end} onChangeText={setEnd} maxLength={5} /></View></View><Button label="Save preferences" onPress={() => run(savePreferences)} busy={busy} /></Card>
    <Card><Text style={ui.heading}>A gentle nudge</Text><Text style={ui.muted}>Receive device reminders for your classes, exams, task deadlines and focus timer. Choose the reminder time on each planner item.</Text><Button label={profile?.remindersEnabled ? 'Turn reminders off' : 'Enable device reminders'} variant="secondary" disabled={busy} onPress={() => run(async () => { if (!profile?.remindersEnabled) await requestReminders(); await save({ ...profile, id: 'profile', kind: 'profile', title: profile?.title || name || 'Student', remindersEnabled: !profile?.remindersEnabled }); setMessage(profile?.remindersEnabled ? 'Planner reminders turned off.' : 'Reminders enabled on this device.'); })} /></Card>
    <Card><Text style={ui.heading}>Your planner, safely in sync</Text><Text style={ui.muted}>{pending ? `${pending} changes saved locally and waiting to sync.` : 'No local changes waiting to upload.'}</Text><Text style={ui.muted}>{lastSync ? `Last cloud sync: ${new Date(lastSync).toLocaleString()}` : 'Your first cloud sync has not finished yet.'}</Text><Button label="Sync now" variant="secondary" onPress={() => run(sync)} busy={syncing} /><Text style={ui.muted}>Your planner stays available offline on this device after you have signed in. Signing in again requires a connection.</Text></Card>
    <Message text={error} error /><Message text={message} />
    <Card><Text style={ui.heading}>Account</Text>{!demo && <Button label="Send password reset email" variant="secondary" disabled={busy} onPress={() => run(async () => { if (!user?.email) return; await sendPasswordResetEmail(auth, user.email); setMessage('Password reset email sent. Check your inbox.'); })} />}<Button label={demo ? 'Exit local demo' : 'Sign out'} variant="danger" onPress={() => setConfirmLogout(true)} /></Card>
    {confirmLogout && <ConfirmDialog title="Sign out of StudyMate?" description={pending ? `${pending} changes are waiting to sync. They stay on this device for this account, but will not reach the cloud until you sign in again. Device reminders will be cancelled.` : 'Your local planner is kept for your account. Device reminders will be cancelled. You will need a connection to sign in again.'} onConfirm={logout} onClose={() => setConfirmLogout(false)} />}
  </View>;
}
