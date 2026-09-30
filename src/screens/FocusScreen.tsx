import React, { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { randomUUID } from 'expo-crypto';
import { useStudy } from '../state/StudyProvider';
import { Badge, Button, Card, Chips, ConfirmDialog, Message } from '../components/study/Controls';
import { palette as p, ui } from '../components/study/theme';
import { friendlyError } from '../services/errors';
import { dateLabel, clockLabel } from '../domain/planner';
import { scheduleFocusReminder, cancelFocusReminder } from '../services/reminders';

interface TimerState { id: string; duration: number; remaining: number; endAt: number | null; subjectId: string; mode: 'focus' | 'break'; }
export function FocusScreen() {
  const { user, profile, records, save } = useStudy();
  const key = `studymate:timer:${user!.uid}`;
  const fresh = (mode: 'focus' | 'break' = 'focus', subjectId = ''): TimerState => { const duration = (mode === 'focus' ? profile?.focusMinutes ?? 25 : profile?.breakMinutes ?? 5) * 60; return { id: randomUUID(), mode, subjectId, duration, remaining: duration, endAt: null }; };
  const [timer, setTimer] = useState<TimerState>(() => fresh());
  const timerRef = useRef(timer);
  const [ready, setReady] = useState(false); const [now, setNow] = useState(Date.now()); const [error, setError] = useState(''); const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false); const [reset, setReset] = useState(false);
  useEffect(() => { let active = true; void AsyncStorage.getItem(key).then(raw => { if (active && raw) { const value = JSON.parse(raw); if (value.duration > 0 && Number.isFinite(value.remaining)) { timerRef.current = value; setTimer(value); } } if (active) setReady(true); }).catch(e => { if (active) setError(friendlyError(e)); }); const interval = setInterval(() => setNow(Date.now()), 500); return () => { active = false; clearInterval(interval); }; }, [key]);
  const persist = async (next: TimerState) => {
    await AsyncStorage.setItem(key, JSON.stringify(next)); timerRef.current = next; setTimer(next); setNow(Date.now());
    try { if (next.endAt && profile?.remindersEnabled) await scheduleFocusReminder(next.endAt, next.mode); else await cancelFocusReminder(); }
    catch (e) { setError(`Timer saved. ${friendlyError(e)}`); }
  };
  const remaining = timer.endAt ? Math.max(0, Math.ceil((timer.endAt - now) / 1000)) : timer.remaining;
  const elapsed = Math.max(0, timer.duration - remaining);
  const active = timer.endAt !== null && remaining > 0;
  const perform = (action: () => Promise<void>) => { setBusy(true); setError(''); setMessage(''); void action().catch(e => setError(friendlyError(e))).finally(() => setBusy(false)); };
  const saveSession = async () => {
    // Reuse the timer ID: retrying after a crash can never create two sessions.
    if (timer.mode === 'focus') {
      if (elapsed < 60) throw new Error('Study for at least one minute before saving a session.');
      await save({ id: `focus-${timer.id}`, kind: 'session', title: 'Focus session', subjectId: timer.subjectId, minutes: Math.floor(elapsed / 60), date: Date.now() });
    }
    await persist(fresh(timer.mode === 'focus' ? 'break' : 'focus', timer.subjectId));
    setMessage(timer.mode === 'focus' ? 'Session saved. A small step worth celebrating. Take a short break.' : 'Break finished. Ready for your next small step?');
  };
  const subjects = records.filter(record => record.kind === 'subject');
  const recent = records.filter(record => record.kind === 'session').sort((a, b) => b.date! - a.date!).slice(0, 5);
  return <View style={{ gap: 22 }}><View style={{ gap: 6 }}><Text style={ui.eyebrow}>ONE THING AT A TIME</Text><Text style={ui.title}>Find your focus</Text><Text style={ui.muted}>A quiet moment for meaningful work. The rest can wait.</Text></View>
    <Card style={{ alignItems: 'center', paddingVertical: 34, gap: 24 }}><Chips options={[{ label: 'Focus', value: 'focus' }, { label: 'Short break', value: 'break' }]} value={timer.mode} onChange={mode => { if (elapsed > 0 || active) { setError('Save or reset your current session before changing mode.'); return; } perform(() => persist(fresh(mode as 'focus' | 'break', timer.subjectId))); }} />
      <View style={{ width: 250, height: 250, borderRadius: 140, borderWidth: 10, borderColor: timer.mode === 'focus' ? p.mint : p.goldSoft, borderTopColor: timer.mode === 'focus' ? p.primary : p.gold, justifyContent: 'center', alignItems: 'center', gap: 10 }}><Text style={{ fontSize: 58, fontWeight: '700', color: p.ink, letterSpacing: -2, fontVariant: ['tabular-nums'] }}>{String(Math.floor(remaining / 60)).padStart(2, '0')}:{String(remaining % 60).padStart(2, '0')}</Text><Text style={ui.muted}>{remaining === 0 ? 'A little progress, made.' : active ? 'Stay with this moment' : elapsed > 0 ? 'Take a breath. Resume when ready.' : 'Your time to grow'}</Text></View>
      <Badge label={timer.mode === 'focus' ? `${Math.round(timer.duration / 60)} MINUTE FOCUS` : `${Math.round(timer.duration / 60)} MINUTE BREAK`} tone={timer.mode === 'focus' ? 'green' : 'gold'} />
      <Text style={ui.muted}>What are you working on?</Text><Chips options={[{ value: '', label: 'General study' }, ...subjects.map(s => ({ value: s.id, label: s.title }))]} value={timer.subjectId} onChange={subjectId => { if (active || elapsed > 0) { setError('Save or reset this session before switching subjects.'); return; } perform(() => persist({ ...timer, subjectId })); }} />
      <View style={[ui.row, { justifyContent: 'center' }]}>{remaining > 0 && <Button icon={active ? 'pause' : 'play'} label={active ? 'Pause session' : elapsed > 0 ? 'Resume session' : 'Begin session'} disabled={!ready} busy={busy} onPress={() => perform(() => persist({ ...timerRef.current, remaining, endAt: active ? null : Date.now() + remaining * 1000 }))} />}<Button icon="check" label={timer.mode === 'focus' ? 'Save session' : 'Finish break'} variant="secondary" disabled={!ready || busy || (timer.mode === 'focus' && elapsed < 60)} onPress={() => perform(saveSession)} /><Button icon="undo" label="Reset" variant="ghost" disabled={!ready || busy} onPress={() => setReset(true)} /></View>
      <Text style={[ui.muted, { maxWidth: 430, textAlign: 'center' }]}>Your timer keeps time when you leave the screen. Save your session to add it to your study history.</Text>
    </Card><Message text={error} error /><Message text={message} />
    <Text style={ui.heading}>Recent moments of focus</Text>{recent.length ? recent.map(session => <Card key={session.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}><View><Text style={[ui.heading, { fontSize: 15 }]}>{records.find(r => r.id === session.subjectId)?.title ?? 'General study'}</Text><Text style={ui.muted}>{dateLabel(session.date)} · {clockLabel(session.date)}</Text></View><Badge label={`${session.minutes} min`} /></Card>) : <Card><Text style={ui.muted}>Your completed focus sessions will appear here. Start with one small session.</Text></Card>}
    {reset && <ConfirmDialog title="Reset this timer?" description="Unsaved time in this session will be discarded. Previously saved sessions stay in your history." onClose={() => setReset(false)} onConfirm={() => persist(fresh(timer.mode, timer.subjectId))} />}
  </View>;
}
