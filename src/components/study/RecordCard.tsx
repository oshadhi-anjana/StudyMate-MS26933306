import { PhotoAttachment } from './PhotoAttachment';
import React from 'react';
import { Text, View } from 'react-native';
import { StudyRecord, days } from '../../domain/models';
import { clockLabel, dateLabel, daysUntil, studyMinutes } from '../../domain/planner';
import { Badge, Button, Card, Check, ProgressBar } from './Controls';
import { palette as p, ui } from './theme';

export function RecordCard({ record, records, onEdit, onDelete, onToggle }: { record: StudyRecord; records: StudyRecord[]; onEdit: () => void; onDelete: () => void; onToggle: () => void }) {
  const subject = records.find(item => item.id === record.subjectId);
  const color = subject?.color ?? record.color ?? p.primary;
  const steps = record.subtasks ?? [];
  const done = steps.filter(step => step.done).length;
  const minutes = record.kind === 'goal' ? studyMinutes(records, record.date ?? 0, record.subjectId, record.dueAt) : 0;
  const remaining = daysUntil(record.dueAt ?? Date.now());
  return <Card style={{ borderLeftWidth: 4, borderLeftColor: color, opacity: record.completed ? 0.75 : 1 }}>
    <View style={ui.between}><View style={[ui.row, { flex: 1, flexWrap: 'nowrap' }]}>{record.kind === 'task' && <Check checked={!!record.completed} onPress={onToggle} label={`Mark ${record.title} ${record.completed ? 'incomplete' : 'complete'}`} />}<View style={{ flex: 1, gap: 5 }}><Text style={[ui.heading, { fontSize: 16 }, record.completed && { textDecorationLine: 'line-through' }]}>{record.title}</Text>{subject && <Text style={[ui.muted, { color }]}>{subject.title}</Text>}</View></View>{record.kind === 'task' && <Badge label={record.completed ? 'Done' : record.priority ?? 'medium'} tone={record.completed ? 'green' : record.priority === 'high' ? 'red' : 'gold'} />}</View>
    {record.kind === 'class' && <><Text style={ui.body}>{days[record.day!]} · {record.startTime} – {record.endTime}</Text>{!!record.location && <Text style={ui.muted}>{record.location}</Text>}</>}
    {record.kind === 'task' && <Text style={[ui.muted, !record.completed && record.dueAt! < Date.now() && { color: p.red }]}>{record.dueAt! < Date.now() && !record.completed ? 'Overdue · ' : 'Due '}{dateLabel(record.dueAt)} · {clockLabel(record.dueAt)} · {record.estimatedMinutes} min effort</Text>}
    {record.kind === 'exam' && <><View style={ui.row}><View style={{ backgroundColor: remaining < 7 ? p.goldSoft : p.mint, borderRadius: 12, padding: 15, minWidth: 90, alignItems: 'center' }}><Text style={{ fontSize: 30, fontWeight: '800', color: remaining < 7 ? p.gold : p.primary }}>{remaining < 0 ? '—' : remaining}</Text><Text style={ui.muted}>{remaining < 0 ? 'Past exam' : remaining === 0 ? 'Today' : 'days to go'}</Text></View><View style={{ flex: 1, gap: 5 }}><Text style={ui.body}>{dateLabel(record.dueAt)} · {clockLabel(record.dueAt)}</Text><Text style={ui.muted}>{record.location || 'Location not set'}</Text></View></View><Text style={ui.muted}>{done} of {steps.length} revision topics completed</Text><ProgressBar label="Revision progress" value={steps.length ? done / steps.length : 0} color={color} /></>}
    {record.kind === 'goal' && <><View style={ui.between}><Text style={ui.body}>{Math.round(minutes)} / {record.targetMinutes} min</Text><Badge label={minutes >= record.targetMinutes! ? 'Achieved' : record.dueAt! < Date.now() ? 'Ended' : 'In progress'} tone={minutes >= record.targetMinutes! ? 'green' : 'gold'} /></View><ProgressBar value={minutes / record.targetMinutes!} color={color} label="Study goal progress" /><Text style={ui.muted}>{dateLabel(record.date)} – {dateLabel(record.dueAt)}</Text></>}
    {!!record.body && <Text style={ui.muted} numberOfLines={record.kind === 'note' ? 5 : 2}>{record.body}</Text>}
    {record.kind === 'task' && steps.length > 0 && <><Text style={ui.muted}>{done}/{steps.length} steps completed</Text><ProgressBar value={done / steps.length} label="Assignment steps" /></>}
    {record.kind === 'note' && !!(record.photoUri || record.photoURL || record.photoId) && <PhotoAttachment photoUri={record.photoUri} photoURL={record.photoURL} photoId={record.photoId} />}
    <View style={[ui.row, { justifyContent: 'flex-end', gap: 4 }]}><Button icon={record.kind === 'note' ? 'file-text-o' : 'pencil'} label={record.kind === 'note' ? 'Open note' : 'Edit'} variant="ghost" small onPress={onEdit} /><Button icon="trash" label="Delete" variant="ghost" small onPress={onDelete} /></View>
  </Card>;
}
