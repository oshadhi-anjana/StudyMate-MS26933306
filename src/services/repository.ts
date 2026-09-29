import AsyncStorage from '@react-native-async-storage/async-storage';
import { randomUUID } from 'expo-crypto';
import { collection, doc, getDocsFromServer, limit, orderBy, query, serverTimestamp, setDoc, startAfter, where, Timestamp, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { emptyState, LocalState, RecordInput, StudyRecord } from '../domain/models';
import { acknowledge, mergeRemote } from '../domain/sync';
import { validateRecord } from '../domain/planner';
import { database } from './firebase';
import { uploadRecordPhoto } from './photos';
import { friendlyError } from './errors';
import { demoState } from '../domain/demo';

export class StudyRepository {
  state: LocalState = emptyState();
  ready = false;
  online = true;
  syncing = false;
  error = '';
  disposed = false;
  private retryAfter = 0;
  private failures = 0;
  private writes: Promise<void> = Promise.resolve();
  private listeners = new Set<() => void>();
  constructor(readonly uid: string, readonly localOnly = false) {}
  private get key() { return `studymate:v1:${this.uid}`; }
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  private emit() { if (!this.disposed) this.listeners.forEach(listener => listener()); }
  async load() {
    try {
      const raw = await AsyncStorage.getItem(this.key);
      if (!raw && this.localOnly) this.state = demoState();
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.version !== 1 || !parsed.records || !parsed.pending) throw new Error('Unsupported local planner format. Local data has been preserved.');
        this.state = parsed;
      }
      this.ready = true;
    } catch (error) { this.error = friendlyError(error); }
    this.emit();
  }
  private commit(change: (previous: LocalState) => LocalState) {
    const operation = this.writes.then(async () => {
      if (this.disposed) return;
      const next = change(this.state);
      await AsyncStorage.setItem(this.key, JSON.stringify(next));
      this.state = next;
      this.emit();
    });
    this.writes = operation.catch(() => undefined);
    return operation;
  }
  async save(input: RecordInput) {
    if (!this.ready || this.disposed) throw new Error('Your planner is still loading.');
    const record: StudyRecord = { ...input, title: input.title.trim(), id: input.id ?? randomUUID(), updatedAt: Date.now(), revision: randomUUID() };
    await this.commit(state => {
      if (!record.deleted) validateRecord(record, Object.values(state.records));
      return { ...state, records: { ...state.records, [record.id]: record }, pending: this.localOnly ? {} : { ...state.pending, [record.id]: record.revision } };
    });
    void this.sync();
    return record;
  }
  async remove(record: StudyRecord) {
    if (record.kind === 'subject' && Object.values(this.state.records).some(r => !r.deleted && r.subjectId === record.id)) {
      throw new Error('This subject is used by planner items. Reassign or delete those items first.');
    }
    await this.save({ ...record, deleted: true });
  }
  setOnline(online: boolean) { const reconnecting = !this.online && online; this.online = online; this.emit(); if (online) void this.sync(reconnecting); }
  async sync(force = false) {
    if (this.localOnly || !this.ready || this.syncing || !this.online || this.disposed || (!force && Date.now() < this.retryAfter)) return;
    this.syncing = true;
    this.error = '';
    this.emit();
    try {
      const ids = Object.keys(this.state.pending);
      // A failed photo must not block unrelated tasks, goals, or notes.
      let firstError: unknown;
      for (const id of ids) {
        if (this.disposed || !this.online) break;
        const sent = this.state.records[id];
        try {
          const uploaded = await uploadRecordPhoto(this.uid, sent);
          if (this.disposed) break;
          const { photoUri: _uri, photoPending: _pending, ...cloud } = uploaded;
          await setDoc(doc(database, 'users', this.uid, 'records', id), { ...JSON.parse(JSON.stringify(cloud)), serverUpdatedAt: serverTimestamp() });
          await this.commit(state => acknowledge(state, sent, uploaded));
        } catch (error) { firstError ??= error; }
      }
      if (!this.disposed && this.online) {
        const remote: StudyRecord[] = [];
        let watermark = this.state.remoteCursor ?? 0;
        let cursor: QueryDocumentSnapshot<DocumentData> | undefined;
        do {
          const base = collection(database, 'users', this.uid, 'records');
          const page = await getDocsFromServer(query(base, where('serverUpdatedAt', '>=', Timestamp.fromMillis(this.state.remoteCursor ?? 0)), orderBy('serverUpdatedAt'), ...(cursor ? [startAfter(cursor)] : []), limit(200)));
          remote.push(...page.docs.map(item => { const { serverUpdatedAt, ...data } = item.data(); watermark = Math.max(watermark, serverUpdatedAt.toMillis()); return { ...data, id: item.id } as StudyRecord; }));
          cursor = page.size === 200 ? page.docs[page.docs.length - 1] : undefined;
        } while (cursor && !this.disposed);
        await this.commit(state => ({ ...mergeRemote(state, remote), lastSync: Date.now(), remoteCursor: watermark }));
      }
      if (firstError) throw firstError;
      this.failures = 0; this.retryAfter = 0;
    } catch (error) { this.error = friendlyError(error); this.failures++; this.retryAfter = Date.now() + Math.min(300000, 15000 * 2 ** Math.min(this.failures, 5)); }
    finally { this.syncing = false; this.emit(); }
  }
  dispose() { this.disposed = true; this.listeners.clear(); }
}
