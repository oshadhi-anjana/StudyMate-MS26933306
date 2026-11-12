import { LocalState, StudyRecord } from './models';

/** A response to an older upload must never acknowledge a newer local edit. */
export function acknowledge(state: LocalState, sent: StudyRecord, uploaded: StudyRecord): LocalState {
  if (state.pending[sent.id] !== sent.revision) return state;
  const pending = { ...state.pending };
  delete pending[sent.id];
  const records = { ...state.records, [sent.id]: uploaded };
  if (sent.deleted) delete records[sent.id];
  return { ...state, pending, records };
}

/** A complete server listing also removes records deleted on another device. */
export function reconcileRemote(state: LocalState, remote: StudyRecord[]): LocalState {
  const ids = new Set(remote.map(record => record.id));
  const merged = mergeRemote(state, remote);
  const records = { ...merged.records };
  for (const id of Object.keys(records)) {
    if (!state.pending[id] && !ids.has(id)) delete records[id];
  }
  return { ...merged, records };
}

/** Pending edits win locally. Server arrival order resolves cross-device conflicts. */
export function mergeRemote(state: LocalState, remote: StudyRecord[]): LocalState {
  const records = { ...state.records };
  for (const record of remote) {
    if (state.pending[record.id]) continue;
    const cached = records[record.id];
    const samePhoto = record.photoId
      ? record.photoId === cached?.photoId
      : !cached?.photoId && !!record.photoPath && cached?.photoPath === record.photoPath;
    records[record.id] = { ...record,
      ...(cached?.photoUri && samePhoto ? { photoUri: cached.photoUri } : {}) };
  }
  return { ...state, records };
}
