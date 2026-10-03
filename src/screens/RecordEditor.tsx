import React, { useState } from 'react';
import { Platform, View } from 'react-native';
import { Text } from '../components/study/Typography';
import { randomUUID } from 'expo-crypto';
import { days, Kind, RecordInput, StudyRecord, subjectColors } from '../domain/models';
import { Button, Chips, Field, Message, Sheet, Check } from '../components/study/Controls';
import { PhotoAttachment } from '../components/study/PhotoAttachment';
import { DateField } from '../components/study/DateField';
import { ui } from '../components/study/theme';
import { useStudy } from '../state/StudyProvider';
import { capturePhoto } from '../services/photos';
import { friendlyError } from '../services/errors';

export const kindLabels: Record<Kind, string> = { subject: 'subject', class: 'class', task: 'assignment / task', exam: 'exam', goal: 'study goal', note: 'note', session: 'study session', profile: 'profile' };
export function RecordEditor({ kind, record, onClose }: { kind: Kind; record?: StudyRecord; onClose: () => void }) {
  const { records, save, user, profile, demo } = useStudy();
  const [draft, setDraft] = useState<RecordInput>(record ?? { kind, title: '', subjectId: '', color: subjectColors[0], body: '', dueAt: Date.now() + 86400000,
    priority: 'medium', estimatedMinutes: 60, day: new Date().getDay(), startTime: '09:00', endTime: '10:00', location: '', targetMinutes: 300, date: Date.now(), subtasks: [], reminderMinutes: -1 });
  const [busy, setBusy] = useState(false); const [photoBusy, setPhotoBusy] = useState(false); const [error, setError] = useState(''); const [subtask, setSubtask] = useState('');
  const patch = (values: Partial<RecordInput>) => setDraft(previous => ({ ...previous, ...values }));
  const subjects = records.filter(item => item.kind === 'subject');
  const photo = async (camera: boolean) => {
    setPhotoBusy(true); setError('');
    try { const uri = await capturePhoto(camera, user!.uid); if (uri) patch({ photoUri: uri, photoId: '', photoURL: '', photoPath: '', photoPending: true }); }
    catch (e) { setError(friendlyError(e)); } finally { setPhotoBusy(false); }
  };
  const submit = async () => { setBusy(true); setError(''); try { await save(draft); onClose(); } catch (e) { setError(friendlyError(e)); setBusy(false); } };
  return <Sheet title={`${record ? 'Edit' : 'New'} ${kindLabels[kind]}`} onClose={() => { if (!busy && !photoBusy) onClose(); }}>
    <Field label={kind === 'subject' ? 'Subject name' : 'Title'} value={draft.title} onChangeText={title => patch({ title })} placeholder={kind === 'task' ? 'e.g. Complete database assignment' : kind === 'subject' ? 'e.g. Enterprise Mobility' : 'Give it a meaningful name'} maxLength={120} />
    {kind !== 'subject' && <View style={{ gap: 8 }}><Text style={ui.muted}>Subject</Text><Chips value={draft.subjectId ?? ''} onChange={subjectId => patch({ subjectId })} options={[{ value: '', label: 'General' }, ...subjects.map(item => ({ value: item.id, label: item.title }))]} />{!subjects.length && <Text style={ui.muted}>You can add subjects in Planner → Subjects.</Text>}</View>}
    {kind === 'subject' && <View style={{ gap: 8 }}><Text style={ui.muted}>Subject colour</Text><Chips options={subjectColors.map((color, i) => ({ value: color, label: ['Jade', 'Gold', 'Indigo', 'Terracotta', 'Lotus', 'Blue'][i] }))} value={draft.color!} onChange={color => patch({ color })} /><View style={{ height: 8, backgroundColor: draft.color, borderRadius: 8 }} /></View>}
    {['task', 'exam', 'goal'].includes(kind) && <DateField label={kind === 'exam' ? 'Exam date and time' : kind === 'goal' ? 'Goal deadline' : 'Due date and time'} value={draft.dueAt!} onChange={dueAt => patch({ dueAt })} />}
    {kind === 'goal' && <><DateField label="Goal starts" value={draft.date!} onChange={date => patch({ date })} /><Field label="Target study minutes" keyboardType="numeric" value={String(draft.targetMinutes ?? '')} onChangeText={text => patch({ targetMinutes: Number(text) })} hint="Study sessions in the selected subject and date range count automatically." /></>}
    {kind === 'class' && <><Text style={ui.muted}>Repeats every week on</Text><Chips options={days.map((label, index) => ({ value: String(index), label: label.slice(0, 3) }))} value={String(draft.day)} onChange={day => patch({ day: Number(day) })} /><View style={ui.row}><View style={ui.grow}><Field label="Start time (24-hour)" value={draft.startTime} onChangeText={startTime => patch({ startTime })} placeholder="09:00" maxLength={5} /></View><View style={ui.grow}><Field label="End time (24-hour)" value={draft.endTime} onChangeText={endTime => patch({ endTime })} placeholder="10:00" maxLength={5} /></View></View></>}
    {['class', 'exam'].includes(kind) && <Field label="Room / location" value={draft.location} onChangeText={location => patch({ location })} placeholder="e.g. Lecture hall B / online" maxLength={160} />}
    {kind === 'task' && <><Text style={ui.muted}>Priority</Text><Chips options={['low', 'medium', 'high'].map(value => ({ value, label: value[0].toUpperCase() + value.slice(1) }))} value={draft.priority!} onChange={priority => patch({ priority: priority as StudyRecord['priority'] })} /><Field label="Estimated effort (minutes)" keyboardType="numeric" value={String(draft.estimatedMinutes ?? '')} onChangeText={text => patch({ estimatedMinutes: Number(text) })} /></>}
    <Field label={kind === 'note' ? 'Your notes' : 'Details / notes'} value={draft.body} onChangeText={body => patch({ body })} multiline placeholder={kind === 'note' ? 'Capture the ideas you want to remember…' : 'Anything else you need to remember…'} maxLength={10000} />
    {['task', 'exam'].includes(kind) && <View style={{ gap: 12 }}><Text style={ui.heading}>{kind === 'exam' ? 'Revision checklist' : 'Break it into small steps'}</Text>{draft.subtasks?.map(item => <View key={item.id} style={ui.row}><Check checked={item.done} onPress={() => patch({ subtasks: draft.subtasks!.map(step => step.id === item.id ? { ...step, done: !step.done } : step) })} label={item.title} /><Text style={[ui.body, ui.grow, item.done && { textDecorationLine: 'line-through' }]}>{item.title}</Text><Button small variant="ghost" icon="times" label="Remove" onPress={() => patch({ subtasks: draft.subtasks!.filter(step => step.id !== item.id) })} /></View>)}
      <Field label={kind === 'exam' ? 'Add a topic to revise' : 'Add a subtask'} value={subtask} onChangeText={setSubtask} maxLength={160} /><Button icon="plus" label="Add to checklist" variant="secondary" small disabled={!subtask.trim() || (draft.subtasks?.length ?? 0) >= 30} onPress={() => { patch({ subtasks: [...(draft.subtasks ?? []), { id: randomUUID(), title: subtask.trim(), done: false }] }); setSubtask(''); }} />
    </View>}
    {['task', 'exam', 'class'].includes(kind) && <View style={{ gap: 10 }}><Text style={ui.muted}>Reminder before {kind === 'task' ? 'deadline' : kind === 'exam' ? 'exam' : 'class'}</Text><Chips value={String(draft.reminderMinutes ?? -1)} onChange={value => patch({ reminderMinutes: Number(value) })} options={[{ value: '-1', label: 'None' }, { value: '10', label: '10 min' }, { value: '30', label: '30 min' }, { value: '60', label: '1 hour' }]} />{!profile?.remindersEnabled && <Text style={ui.muted}>Enable device reminders in Profile to receive notifications.</Text>}</View>}
    {['note', 'task'].includes(kind) && <View style={{ gap: 12 }}><Text style={ui.heading}>A picture worth keeping</Text><Text style={ui.muted}>Attach one photo, compressed to a JPEG of up to 200 KB.</Text>{(draft.photoUri || draft.photoURL || draft.photoId) && <><PhotoAttachment photoUri={draft.photoUri} photoURL={draft.photoURL} photoId={draft.photoId} autoLoad /><Button icon="trash" label="Remove photo" variant="danger" small onPress={() => patch({ photoId: '', photoUri: '', photoURL: '', photoPath: '', photoPending: false })} /></>}<View style={ui.row}>{Platform.OS !== 'web' && <Button icon="camera" label="Take a photo" variant="secondary" onPress={() => void photo(true)} busy={photoBusy} />}<Button icon="image" label="Choose a photo" variant="secondary" onPress={() => void photo(false)} disabled={photoBusy} /></View></View>}
    <Message text={error} error /><Button icon="save" label={busy ? 'Saving…' : 'Save to my planner'} onPress={() => void submit()} busy={busy} disabled={photoBusy} />
    <Text style={[ui.muted, { textAlign: 'center', fontSize: 11 }]}>{demo ? 'Local demo: saved on this device only.' : 'Saved on this device first. Synced to your account when connected.'}</Text>
  </Sheet>;
}
