import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { useStudy } from '../state/StudyProvider';
import { Kind, StudyRecord, days } from '../domain/models';
import { Button, Chips, EmptyState, Field } from '../components/study/Controls';
import { RecordCard } from '../components/study/RecordCard';
import { ui } from '../components/study/theme';
import { kindLabels } from './RecordEditor';
const sections: { label: string; value: Kind }[] = [{ label: 'Assignments', value: 'task' }, { label: 'Timetable', value: 'class' }, { label: 'Exams', value: 'exam' }, { label: 'Goals', value: 'goal' }, { label: 'Subjects', value: 'subject' }, { label: 'Notes', value: 'note' }];
export function PlannerScreen({ onAdd, onEdit, onDelete, onError }: { onAdd: (kind: Kind) => void; onEdit: (record: StudyRecord) => void; onDelete: (record: StudyRecord) => void; onError: (error: unknown) => void }) {
  const { records, save } = useStudy();
  const [kind, setKind] = useState<Kind>('task'); const [search, setSearch] = useState(''); const [status, setStatus] = useState('open'); const [day, setDay] = useState(String(new Date().getDay())); const [count, setCount] = useState(20);
  const items = records.filter(item => item.kind === kind && `${item.title} ${item.body ?? ''} ${records.find(subject => subject.id === item.subjectId)?.title ?? ''}`.toLowerCase().includes(search.toLowerCase()) &&
    (kind !== 'task' || status === 'all' || (status === 'done' ? item.completed : !item.completed)) && (kind !== 'class' || day === 'all' || item.day === Number(day)))
    .sort((a, b) => kind === 'class' ? (a.day! - b.day!) || a.startTime!.localeCompare(b.startTime!) : ['task', 'exam', 'goal'].includes(kind) ? a.dueAt! - b.dueAt! : a.title.localeCompare(b.title));
  return <View style={{ gap: 22 }}><View style={[ui.between, { flexWrap: 'wrap' }]}><View style={{ gap: 6 }}><Text style={ui.eyebrow}>A PLACE FOR EVERY PLAN</Text><Text style={ui.title}>Your study planner</Text><Text style={ui.muted}>Give your week a little structure. Leave room to grow.</Text></View><Button label={`+ Add ${kind === 'task' ? 'task' : kindLabels[kind]}`} onPress={() => onAdd(kind)} /></View>
    <Chips options={sections} value={kind} onChange={value => { setKind(value as Kind); setCount(20); setSearch(''); }} />
    <Field label="Find something in your planner" placeholder="Search titles, subjects or notes…" value={search} onChangeText={value => { setSearch(value); setCount(20); }} />
    {kind === 'task' && <Chips options={[{ label: 'To do', value: 'open' }, { label: 'Completed', value: 'done' }, { label: 'All tasks', value: 'all' }]} value={status} onChange={setStatus} />}
    {kind === 'class' && <Chips options={[{ label: 'Full week', value: 'all' }, ...days.map((label, i) => ({ label: label.slice(0, 3), value: String(i) }))]} value={day} onChange={setDay} />}
    <View style={ui.between}><Text style={ui.muted}>{items.length} {items.length === 1 ? 'item' : 'items'}</Text>{kind === 'class' && <Text style={ui.muted}>Repeats weekly</Text>}</View>
    {items.length === 0 ? <EmptyState title={search ? 'Nothing found just yet' : 'Your next chapter starts here'} detail={search ? 'Try a different word or clear your filters.' : `Add your first ${kindLabels[kind]} and start building your personal study space.`} action={search ? 'Clear search' : `+ Add ${kindLabels[kind]}`} onAction={() => search ? setSearch('') : onAdd(kind)} /> : <View style={{ gap: 14 }}>{items.slice(0, count).map(record => <RecordCard key={record.id} record={record} records={records} onEdit={() => onEdit(record)} onDelete={() => onDelete(record)} onToggle={() => { void save({ ...record, completed: !record.completed }).catch(onError); }} />)}</View>}
    {items.length > count && <Button label="Show 20 more" variant="secondary" onPress={() => setCount(count + 20)} />}
  </View>;
}
