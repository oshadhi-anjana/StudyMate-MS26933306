import { Icon } from '../components/study/Icon';
import React, { useState } from 'react';
import { Pressable, View, useWindowDimensions } from 'react-native';
import { Text } from '../components/study/Typography';
import { useStudy } from '../state/StudyProvider';
import { Button, Card, Sheet } from '../components/study/Controls';
import { palette as p, ui } from '../components/study/theme';
import { availableStudyMinutes, clockLabel, daysUntil, dayStart, rankedTasks, studyMinutes, studyStreak, suggestSlot } from '../domain/planner';
import { days, Kind, StudyRecord } from '../domain/models';

export function DashboardScreen({ onAdd, navigate }: { onAdd: (kind: Kind) => void; navigate: (tab: string) => void }) {
  const { user, profile, records } = useStudy();
  const [selectedClass, setSelectedClass] = useState<StudyRecord | null>(null);
  const wide = useWindowDimensions().width >= 1050;
  const tasks = rankedTasks(records);
  const today = dayStart();
  const minutes = studyMinutes(records, today);
  const target = profile?.dailyMinutes ?? 120;
  const classes = records.filter(item => item.kind === 'class' && item.day === new Date().getDay()).sort((a, b) => a.startTime!.localeCompare(b.startTime!));
  const exams = records.filter(item => item.kind === 'exam' && item.dueAt! >= today).sort((a, b) => a.dueAt! - b.dueAt!);
  const slot = suggestSlot(records, profile?.focusMinutes ?? 25, profile?.availableStart ?? '17:00', profile?.availableEnd ?? '21:00');
  const dueToday = tasks.filter(item => dayStart(new Date(item.dueAt!)) === today);
  const workload = tasks.filter(item => item.dueAt! < today + 86400000).reduce((sum, item) => sum + (item.estimatedMinutes ?? 0), 0);
  const available = availableStudyMinutes(records, profile?.availableStart ?? '17:00', profile?.availableEnd ?? '21:00');
  const firstName = (profile?.title || user?.displayName || 'student').split(' ')[0];
  return <View style={{ gap: 24 }}>
    <View style={[ui.between, { flexWrap: 'wrap' }]}><View style={{ gap: 6 }}><Text style={ui.eyebrow}>{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</Text><Text style={ui.title}>Your day, a little clearer.</Text><Text style={ui.muted}>Welcome back, {firstName}. Let’s make progress at your pace.</Text></View></View>
    <View style={{ backgroundColor: p.primaryDark, borderRadius: 24, padding: wide ? 32 : 24, flexDirection: 'row', gap: 20, overflow: 'hidden' }}>
      <View style={{ flex: 1, gap: 14 }}><Text style={{ color: '#DAC581', fontSize: 11, fontWeight: '800', letterSpacing: 2 }}>SMALL STEPS. MEANINGFUL PROGRESS.</Text><Text style={{ color: '#FFFEF0', fontSize: wide ? 32 : 26, lineHeight: wide ? 39 : 33, fontWeight: '700', maxWidth: 460 }}>A focused today.{`\n`}A brighter tomorrow.</Text><Text style={{ color: '#BCD5C9', fontSize: 14, lineHeight: 22, maxWidth: 380 }}>You don’t have to do it all at once. Give one thing your attention.</Text><View style={ui.row}><Button icon="play" label="Start a focus session" variant="secondary" onPress={() => navigate('Focus')} /></View></View>
      {wide && <View style={{ width: 200, justifyContent: 'center', alignItems: 'center' }}><View style={{ width: 156, height: 156, borderRadius: 90, borderWidth: 12, borderColor: '#538A65', borderRightColor: '#E3C97F', justifyContent: 'center', alignItems: 'center', transform: [{ rotate: '-12deg' }] }}><Text style={{ color: 'white', fontSize: 45, fontWeight: '700', transform: [{ rotate: '12deg' }] }}>{Math.min(100, Math.round(minutes / target * 100))}%</Text><Text style={{ color: '#CDE0D1', fontSize: 12 }}>daily goal</Text></View></View>}
    </View>
    <View style={[ui.row, { alignItems: 'stretch', gap: 12 }]}>{[
      ['Tasks to finish', String(tasks.length), `${dueToday.length} due today`, p.primary, p.mint],
      ['Study time today', `${Math.round(minutes)}m`, `of ${target} min daily goal`, p.gold, p.goldSoft],
      ['Upcoming exams', String(exams.length), exams[0] ? `${daysUntil(exams[0].dueAt!)} days to the next` : 'Room to prepare', p.purple, p.lavender],
      ['Study streak', `${studyStreak(records)} days`, 'Keep showing up for you', p.blue, '#E7F0F5'],
    ].map(([label, value, detail, color, background]) => <Card key={label} style={{ flex: 1, minWidth: 140, padding: 18 }}><View style={{ width: 30, height: 5, backgroundColor: color, borderRadius: 4 }} /><Text style={ui.muted}>{label}</Text><Text style={{ fontSize: 29, fontWeight: '800', color: p.ink, letterSpacing: -0.8 }}>{value}</Text><Text style={[ui.muted, { fontSize: 11, color }]}>{detail}</Text></Card>)}</View>
    {workload > available && <Card style={{ backgroundColor: p.goldSoft, borderColor: '#EDDBB0' }}><Text style={[ui.heading, { fontSize: 16 }]}>Give today a little breathing room</Text><Text style={ui.muted}>You have about {workload} minutes of unfinished work due today or earlier, and {available} free minutes left in your study window. Start with the highest priority task, or reschedule work where your deadlines allow.</Text></Card>}
    <View style={{ flexDirection: wide ? 'row' : 'column', gap: 24 }}><View style={{ flex: 1.4, gap: 24 }}>
      <View style={{ gap: 14 }}><View style={ui.between}><Text style={ui.heading}>Today’s timetable</Text><Button icon="plus" label="Class" small variant="ghost" onPress={() => onAdd('class')} /></View>{!classes.length ? <Card><Text style={ui.muted}>No classes scheduled today. Make a little time for independent study.</Text></Card> : classes.map(item => <Pressable key={item.id} accessibilityRole="button" onPress={() => setSelectedClass(item)} accessibilityLabel={`View details for ${item.title}`}><Card style={{ flexDirection: 'row', alignItems: 'center' }}><View style={{ paddingRight: 18, borderRightWidth: 2, borderRightColor: records.find(r => r.id === item.subjectId)?.color ?? p.primary }}><Text style={{ fontWeight: '700', color: p.ink }}>{item.startTime}</Text><Text style={ui.muted}>{item.endTime}</Text></View><View style={{ flex: 1 }}><Text style={[ui.heading, { fontSize: 15 }]}>{item.title}</Text><Text style={ui.muted}>{item.location || 'Location not set'}</Text></View><Icon name="external-link" color={p.primary} size={16} /></Card></Pressable>)}</View>
    </View><View style={{ flex: 1, gap: 20 }}>
      <Card style={{ backgroundColor: '#F0F3E8', borderColor: '#DAE4CB' }}><Text style={ui.eyebrow}>YOUR NEXT SMALL STEP</Text><Text style={ui.heading}>{tasks[0]?.title ?? 'Make time for what matters'}</Text><Text style={ui.muted}>{tasks[0] ? `Suggested because of its deadline, priority and estimated effort. ${tasks[0].estimatedMinutes} minutes of work remaining.` : 'Add your tasks to receive a personalised study suggestion.'}</Text><View style={ui.divider} /><Text style={{ color: p.primary, fontWeight: '700', fontSize: 14 }}>{slot ? `${clockLabel(slot)} · ${profile?.focusMinutes ?? 25} minutes free today` : 'Your study window is full today'}</Text><Text style={ui.muted}>{slot ? 'Fits around your classes and preferred study hours.' : 'Try a shorter session or change your available hours in Profile.'}</Text><Button icon="arrow-right" label="Make a little progress" variant="secondary" onPress={() => navigate('Focus')} /></Card>
    </View></View>
    {selectedClass && <Sheet title="Class details" onClose={() => setSelectedClass(null)}>
      <Text style={ui.heading}>{selectedClass.title}</Text>
      <Text style={ui.body}>Subject: {records.find(item => item.id === selectedClass.subjectId)?.title ?? 'General'}</Text>
      <Text style={ui.body}>{days[selectedClass.day ?? new Date().getDay()]} · {selectedClass.startTime} – {selectedClass.endTime}</Text>
      <Text style={ui.muted}>Location: {selectedClass.location || 'Location not set'}</Text>
      {!!selectedClass.body && <Text style={ui.body}>{selectedClass.body}</Text>}
      {selectedClass.reminderMinutes !== undefined && selectedClass.reminderMinutes >= 0 && <Text style={ui.muted}>Reminder: {selectedClass.reminderMinutes === 0 ? 'At class start' : selectedClass.reminderMinutes + ' minutes before'}</Text>}
    </Sheet>}
  </View>;
}
