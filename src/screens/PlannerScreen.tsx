import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Text } from '../components/study/Typography';
import { useStudy } from '../state/StudyProvider';
import { Kind, StudyRecord, days } from '../domain/models';
import { Button, Chips, EmptyState, Field, Sheet } from '../components/study/Controls';
import { RecordCard } from '../components/study/RecordCard';
import { palette as p, ui } from '../components/study/theme';
import { kindLabels } from './RecordEditor';
const sections: { label: string; value: Kind }[] = [{ label: 'Assignments', value: 'task' }, { label: 'Timetable', value: 'class' }, { label: 'Exams', value: 'exam' }, { label: 'Goals', value: 'goal' }, { label: 'Subjects', value: 'subject' }, { label: 'Notes', value: 'note' }];
export function PlannerScreen({ onAdd, onEdit, onDelete, onError }: { onAdd: (kind: Kind) => void; onEdit: (record: StudyRecord) => void; onDelete: (record: StudyRecord) => void; onError: (error: unknown) => void }) {
  const { records, save } = useStudy();
  const [kind, setKind] = useState<Kind>('task'); const [search, setSearch] = useState(''); const [status, setStatus] = useState('open'); const [day, setDay] = useState(String(new Date().getDay())); const [count, setCount] = useState(20);
  const [timetableView, setTimetableView] = useState('list');
  const [selectedClass, setSelectedClass] = useState<StudyRecord | null>(null);
  const items = records.filter(item => item.kind === kind && `${item.title} ${item.body ?? ''} ${records.find(subject => subject.id === item.subjectId)?.title ?? ''}`.toLowerCase().includes(search.toLowerCase()) &&
    (kind !== 'task' || status === 'all' || (status === 'done' ? item.completed : !item.completed)) && (kind !== 'class' || day === 'all' || item.day === Number(day)))
    .sort((a, b) => kind === 'class' ? (a.day! - b.day!) || a.startTime!.localeCompare(b.startTime!) : ['task', 'exam', 'goal'].includes(kind) ? a.dueAt! - b.dueAt! : a.title.localeCompare(b.title));
  return <View style={{ gap: 22 }}><View style={[ui.between, { flexWrap: 'wrap' }]}><View style={{ gap: 6 }}><Text style={ui.eyebrow}>A PLACE FOR EVERY PLAN</Text><Text style={ui.title}>Your study planner</Text><Text style={ui.muted}>Give your week a little structure. Leave room to grow.</Text></View><Button icon="plus" label={`Add ${kind === 'task' ? 'task' : kindLabels[kind]}`} onPress={() => onAdd(kind)} /></View>
    <Chips options={sections} value={kind} onChange={value => { setKind(value as Kind); setCount(20); setSearch(''); }} />
    <Field label="Find something in your planner" placeholder="Search titles, subjects or notes…" value={search} onChangeText={value => { setSearch(value); setCount(20); }} />
    {kind === 'task' && <Chips options={[{ label: 'To do', value: 'open' }, { label: 'Completed', value: 'done' }, { label: 'All tasks', value: 'all' }]} value={status} onChange={setStatus} />}
    {kind === 'class' && <Chips options={[{ label: 'Full week', value: 'all' }, ...days.map((label, i) => ({ label: label.slice(0, 3), value: String(i) }))]} value={day} onChange={setDay} />}
    {kind === 'class' && <Chips options={[{ label: 'List view', value: 'list' }, { label: 'Table view', value: 'table' }]} value={timetableView} onChange={setTimetableView} />}
    <View style={ui.between}><Text style={ui.muted}>{items.length} {items.length === 1 ? 'item' : 'items'}</Text>{kind === 'class' && <Text style={ui.muted}>Repeats weekly</Text>}</View>
    {items.length === 0 ? <EmptyState title={search ? 'Nothing found just yet' : 'Your next chapter starts here'} detail={search ? 'Try a different word or clear your filters.' : `Add your first ${kindLabels[kind]} and start building your personal study space.`} action={search ? 'Clear search' : `Add ${kindLabels[kind]}`} onAction={() => search ? setSearch('') : onAdd(kind)} /> : kind === 'class' && timetableView === 'table' ? <ScrollView horizontal><View style={{ minWidth: 800, borderWidth: 1, borderColor: p.border, borderRadius: 12, overflow: 'hidden' }}>
      <View style={{ flexDirection: 'row', padding: 12, backgroundColor: p.mint, gap: 12 }}>{['Day', 'Time', 'Class / Subject', 'Location', 'Actions'].map((title, index) => <Text key={title} style={[ui.body, { width: [90, 130, 220, 150, 150][index], fontWeight: '700' }]}>{title}</Text>)}</View>
      {items.slice(0, count).map(record => <View key={record.id} style={{ flexDirection: 'row', alignItems: 'center', padding: 10, gap: 12, borderTopWidth: 1, borderTopColor: p.border, backgroundColor: p.surface }}>
        <Text style={[ui.muted, { width: 90 }]}>{days[record.day!]}</Text>
        <Text style={[ui.muted, { width: 130 }]}>{record.startTime} – {record.endTime}</Text>
        <View style={{ width: 220 }}><Text style={ui.body}>{record.title}</Text><Text style={ui.muted}>{records.find(subject => subject.id === record.subjectId)?.title ?? 'General'}</Text></View>
        <Text style={[ui.muted, { width: 150 }]}>{record.location || 'Location not set'}</Text>
        <View style={{ width: 150, flexDirection: 'row' }}><Button icon="eye" label="View" variant="ghost" small onPress={() => setSelectedClass(record)} /><Button icon="pencil" label="Edit" variant="ghost" small onPress={() => onEdit(record)} /></View>
      </View>)}
    </View></ScrollView> : <View style={{ gap: kind === 'task' || kind === 'class' ? 8 : 14 }}>{items.slice(0, count).map(record => <RecordCard key={record.id} record={record} records={records} onEdit={() => onEdit(record)} onDelete={() => onDelete(record)} onToggle={() => { void save({ ...record, completed: !record.completed }).catch(onError); }} />)}</View>}
    {items.length > count && <Button icon="chevron-down" label="Show 20 more" variant="secondary" onPress={() => setCount(count + 20)} />}
    {selectedClass && <Sheet title="Class details" onClose={() => setSelectedClass(null)}>
      <Text style={ui.heading}>{selectedClass.title}</Text>
      <Text style={ui.body}>Subject: {records.find(record => record.id === selectedClass.subjectId)?.title ?? 'General'}</Text>
      <Text style={ui.body}>{days[selectedClass.day!]} · {selectedClass.startTime} – {selectedClass.endTime}</Text>
      <Text style={ui.muted}>Location: {selectedClass.location || 'Location not set'}</Text>
      {!!selectedClass.body && <Text style={ui.body}>{selectedClass.body}</Text>}
    </Sheet>}
  </View>;
}
