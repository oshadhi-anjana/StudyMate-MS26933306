import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../services/auth';
import { StudyRepository } from '../services/repository';
import { RecordInput, StudyRecord } from '../domain/models';
import { clearReminders, reconcileReminders } from '../services/reminders';
import { friendlyError } from '../services/errors';
import { completeSignOut } from '../domain/signOut';

interface StudyContextValue {
  user: Pick<User, 'uid' | 'email' | 'displayName'> | null; authReady: boolean; ready: boolean; records: StudyRecord[];
  demo: boolean; enterDemo: () => void;
  sessionNotice: string;
  profile?: StudyRecord; online: boolean; syncing: boolean; pending: number; lastSync: number; error: string;
  save: (record: RecordInput) => Promise<StudyRecord>; remove: (record: StudyRecord) => Promise<void>;
  sync: () => Promise<void>; logout: () => Promise<void>;
}
const Context = createContext<StudyContextValue | null>(null);
export function StudyProvider({ children }: React.PropsWithChildren) {
  const [authUser, setUser] = useState<User | null>(null);
  const [demo, setDemo] = useState(false);
  const user = demo ? { uid: 'local-preview', email: 'Local demo · no cloud account', displayName: 'Oshadhi' } : authUser;
  const [authReady, setAuthReady] = useState(false);
  const [, render] = useState(0);
  const [reminderError, setReminderError] = useState('');
  const [sessionNotice, setSessionNotice] = useState('');
  const repo = useMemo(() => user ? new StudyRepository(user.uid, demo) : null, [user?.uid, demo]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => onAuthStateChanged(auth, value => { setUser(value); setAuthReady(true); }), []);
  useEffect(() => {
    if (!repo) return;
    const stop = repo.subscribe(() => render(value => value + 1));
    void repo.load().then(() => repo.sync());
    const network = NetInfo.addEventListener(state => repo.setOnline(state.isConnected !== false && state.isInternetReachable !== false));
    const active = AppState.addEventListener('change', state => { if (state === 'active') void repo.sync(); });
    const interval = setInterval(() => { if (AppState.currentState === 'active' || AppState.currentState === null) void repo.sync(); }, 60000);
    return () => { stop(); network(); active.remove(); clearInterval(interval); repo.dispose(); };
  }, [repo]);
  const records = Object.values(repo?.state.records ?? {}).filter(record => !record.deleted);
  const profile = records.find(record => record.kind === 'profile');
  useEffect(() => {
    if (!repo?.ready || !user) return;
    let cancelled = false;
    const timer = setTimeout(() => { void reconcileReminders(user.uid, Object.values(repo.state.records), profile?.remindersEnabled ?? false)
      .then(() => { if (!cancelled) setReminderError(''); })
      .catch(error => { if (!cancelled) setReminderError(friendlyError(error)); }); }, 700);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [repo?.state.records, profile?.remindersEnabled, user?.uid, repo?.ready]);
  const value: StudyContextValue = {
    user, demo, sessionNotice, enterDemo: () => { setSessionNotice(''); setDemo(true); }, authReady, ready: repo?.ready ?? false, records, profile,
    online: repo?.online ?? true, syncing: repo?.syncing ?? false,
    pending: Object.keys(repo?.state.pending ?? {}).length, lastSync: repo?.state.lastSync ?? 0,
    error: repo?.error || reminderError,
    save: input => { if (!repo) throw new Error('Sign in first.'); return repo.save(input); },
    remove: input => { if (!repo) throw new Error('Sign in first.'); return repo.remove(input); },
    sync: async () => { await repo?.sync(true); },
    logout: async () => {
      setSessionNotice('');
      const cleanupError = await completeSignOut(clearReminders, async () => {
        if (demo) setDemo(false);
        else await signOut(auth);
      });
      setReminderError('');
      if (cleanupError) {
        console.warn('StudyMate signed out, but notification cleanup failed:', cleanupError);
        setSessionNotice('You are signed out, but this device could not cancel scheduled reminders. They may still appear. ' + friendlyError(cleanupError));
      }
    },
  };
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useStudy() { const value = useContext(Context); if (!value) throw new Error('StudyProvider is missing.'); return value; }
