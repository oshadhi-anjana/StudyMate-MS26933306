import { PhotoAttachment } from './PhotoAttachment';
import React, { useState } from 'react';
import { View } from 'react-native';
import { Text } from './Typography';
import { StudyRecord, days } from '../../domain/models';
import { clockLabel, dateLabel, daysUntil, studyMinutes } from '../../domain/planner';
import { Badge, Button, Card, Check, ProgressBar, Sheet } from './Controls';
import { palette as p, ui } from './theme';

export function RecordCard({ record, records, onEdit, onDelete, onToggle }: { record: StudyRecord; records: StudyRecord[]; onEdit: () => void; onDelete: () => void; onToggle: () => void }) {
  const [viewing, setViewing] = useState(false);
  const [viewingImage, setViewingImage] = useState(false);
  const compact = record.kind === 'task' || record.kind === 'class';
  const subject = records.find(item => item.id === record.subjectId);
  const color = subject?.color ?? record.color ?? p.primary;
  const steps = record.subtasks ?? [];
  const done = steps.filter(step => step.done).length;
  const minutes = record.kind === 'goal' ? studyMinutes(records, record.date ?? 0, record.subjectId, record.dueAt) : 0;
  const remaining = daysUntil(record.dueAt ?? Date.now());
  return <Card style={{ padding: compact ? 12 : 20, gap: compact ? 6 : 12, borderLeftWidth: 4, borderLeftColor: color, opacity: record.completed ? 0.75 : 1 }}>
    <View style={ui.between}><View style={[ui.row, { flex: 1, flexWrap: 'nowrap' }]}>{record.kind === 'task' && <Check checked={!!record.completed} onPress={onToggle} label={`Mark ${record.title} ${record.completed ? 'incomplete' : 'complete'}`} />}<View style={{ flex: 1, gap: 5 }}><Text style={[ui.heading, { fontSize: compact ? 14 : 16 }, record.completed && { textDecorationLine: 'line-through' }]}>{record.title}</Text>{subject && <Text style={[ui.muted, { color }]}>{subject.title}</Text>}</View></View>{record.kind === 'task' && <Badge label={record.completed ? 'Done' : record.priority ?? 'medium'} tone={record.completed ? 'green' : record.priority === 'high' ? 'red' : 'gold'} />}</View>
    {record.kind === 'class' && <><Text style={ui.body}>{days[record.day!]} · {record.startTime} – {record.endTime}</Text>{!!record.location && <Text style={ui.muted}>{record.location}</Text>}</>}
    {record.kind === 'task' && <Text style={[ui.muted, !record.completed && record.dueAt! < Date.now() && { color: p.red }]}>{record.dueAt! < Date.now() && !record.completed ? 'Overdue · ' : 'Due '}{dateLabel(record.dueAt)} · {clockLabel(record.dueAt)} · {record.estimatedMinutes} min effort</Text>}
    {record.kind === 'exam' && <><View style={ui.row}><View style={{ backgroundColor: remaining < 7 ? p.goldSoft : p.mint, borderRadius: 12, padding: 15, minWidth: 90, alignItems: 'center' }}><Text style={{ fontSize: 30, fontWeight: '800', color: remaining < 7 ? p.gold : p.primary }}>{remaining < 0 ? '—' : remaining}</Text><Text style={ui.muted}>{remaining < 0 ? 'Past exam' : remaining === 0 ? 'Today' : 'days to go'}</Text></View><View style={{ flex: 1, gap: 5 }}><Text style={ui.body}>{dateLabel(record.dueAt)} · {clockLabel(record.dueAt)}</Text><Text style={ui.muted}>{record.location || 'Location not set'}</Text></View></View><Text style={ui.muted}>{done} of {steps.length} revision topics completed</Text><ProgressBar label="Revision progress" value={steps.length ? done / steps.length : 0} color={color} /></>}
    {record.kind === 'goal' && <><View style={ui.between}><Text style={ui.body}>{Math.round(minutes)} / {record.targetMinutes} min</Text><Badge label={minutes >= record.targetMinutes! ? 'Achieved' : record.dueAt! < Date.now() ? 'Ended' : 'In progress'} tone={minutes >= record.targetMinutes! ? 'green' : 'gold'} /></View><ProgressBar value={minutes / record.targetMinutes!} color={color} label="Study goal progress" /><Text style={ui.muted}>{dateLabel(record.date)} – {dateLabel(record.dueAt)}</Text></>}
    {!compact && !!record.body && <Text style={ui.muted} numberOfLines={record.kind === 'note' ? 5 : 2}>{record.body}</Text>}
    {record.kind === 'task' && steps.length > 0 && <><Text style={ui.muted}>{done}/{steps.length} steps completed</Text></>}
    <View style={[ui.row, { justifyContent: 'flex-end', gap: 4 }]}>
      <Button icon="eye" label="View" variant="ghost" small onPress={() => setViewing(true)} />
      {!(record.kind === 'task' && record.completed) && <Button icon="pencil" label="Edit" variant="ghost" small onPress={onEdit} />}
      {['note', 'task'].includes(record.kind) && !!(record.photoUri || record.photoURL || record.photoId) && <Button icon="image" label="View image" variant="ghost" small onPress={() => setViewingImage(true)} />}
      <Button icon="trash" label="Delete" variant="ghost" small onPress={onDelete} />
    </View>
    {viewing && <Sheet title="Details" onClose={() => setViewing(false)}>
      <Text style={ui.heading}>{record.title}</Text>
      {subject && <Text style={ui.body}>Subject: {subject.title}</Text>}
      {record.kind === 'class' && <><Text style={ui.body}>{days[record.day!]} · {record.startTime} – {record.endTime}</Text><Text style={ui.muted}>Location: {record.location || 'Location not set'}</Text></>}
      {['task', 'exam', 'goal'].includes(record.kind) && <Text style={ui.body}>Due: {dateLabel(record.dueAt)} · {clockLabel(record.dueAt)}</Text>}
      {record.kind === 'task' && <><Text style={ui.body}>Status: {record.completed ? 'Completed' : 'To do'} · Priority: {record.priority ?? 'medium'}</Text><Text style={ui.muted}>Estimated effort: {record.estimatedMinutes ?? 0} minutes</Text></>}
      {record.kind === 'exam' && <Text style={ui.muted}>Location: {record.location || 'Location not set'}</Text>}
      {record.kind === 'goal' && <Text style={ui.body}>{Math.round(minutes)} / {record.targetMinutes} minutes · {dateLabel(record.date)} – {dateLabel(record.dueAt)}</Text>}
      {!!record.body && <Text style={ui.body}>{record.body}</Text>}
      {steps.map(step => <Text key={step.id} style={ui.body}>{step.done ? '✓' : '○'} {step.title}</Text>)}
      {['note', 'task'].includes(record.kind) && !!(record.photoUri || record.photoURL || record.photoId) && <PhotoAttachment photoUri={record.photoUri} photoURL={record.photoURL} photoId={record.photoId} autoLoad />}
    </Sheet>}
    {viewingImage && <Sheet title="Attached image" onClose={() => setViewingImage(false)}><PhotoAttachment photoUri={record.photoUri} photoURL={record.photoURL} photoId={record.photoId} autoLoad /></Sheet>}
  </Card>;
}
