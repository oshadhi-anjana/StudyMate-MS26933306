import React from 'react';
import { View } from 'react-native';
import { Text } from '../components/study/Typography';
import { useStudy } from '../state/StudyProvider';
import { Badge, Card, ProgressBar } from '../components/study/Controls';
import { palette as p, ui } from '../components/study/theme';
import { dayStart, studyMinutes, studyStreak, weekStart } from '../domain/planner';
export function ProgressScreen() {
  const { records } = useStudy();
  const start = weekStart();
  const total = studyMinutes(records, start);
  const subjects = records.filter(r => r.kind === 'subject');
  const tasks = records.filter(r => r.kind === 'task');
  const complete = tasks.filter(r => r.completed).length;
  const bars = Array.from({ length: 7 }, (_, index) => { const date = new Date(start); date.setDate(date.getDate() + index); const end = new Date(date); end.setDate(end.getDate() + 1); return { day: date.toLocaleDateString(undefined, { weekday: 'short' }), minutes: studyMinutes(records, dayStart(date), undefined, dayStart(end)) }; });
  const max = Math.max(60, ...bars.map(bar => bar.minutes));
  const goals = records.filter(r => r.kind === 'goal');
  return <View style={{ gap: 24 }}><View style={{ gap: 6 }}><Text style={ui.eyebrow}>EVERY LITTLE EFFORT COUNTS</Text><Text style={ui.title}>See how far you’ve come</Text><Text style={ui.muted}>A clearer picture of your habits, one week at a time.</Text></View>
    <View style={[ui.row, { alignItems: 'stretch' }]}>{[[`${Math.floor(total / 60)}h ${total % 60}m`, 'Focused this week'], [`${complete}/${tasks.length}`, 'Tasks completed overall'], [`${studyStreak(records)} days`, 'Current study streak']].map(([value, title]) => <Card key={title} style={{ flex: 1, minWidth: 170 }}><Text style={ui.muted}>{title}</Text><Text style={{ fontSize: 30, color: p.primary, fontWeight: '800' }}>{value}</Text></Card>)}</View>
    <Card><View style={ui.between}><Text style={ui.heading}>Your week in focus</Text><Badge label="MON – SUN" /></View><Text style={ui.muted}>Minutes spent studying each day</Text><View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-end', height: 210, paddingTop: 20 }}>{bars.map((bar, index) => <View key={bar.day} style={{ flex: 1, alignItems: 'center', gap: 8 }}><Text style={{ color: p.muted, fontSize: 11 }}>{bar.minutes}m</Text><View accessibilityLabel={`${bar.day}: ${bar.minutes} minutes`} style={{ width: '65%', maxWidth: 55, height: Math.max(5, bar.minutes / max * 140), backgroundColor: index === (new Date().getDay() + 6) % 7 ? p.gold : p.primary, borderRadius: 7 }} /><Text style={ui.muted}>{bar.day}</Text></View>)}</View></Card>
    <Card><Text style={ui.heading}>Where your attention goes</Text><Text style={ui.muted}>Study time by subject this week</Text>{[...subjects.map(subject => ({ id: subject.id, title: subject.title, color: subject.color })), { id: '', title: 'General study', color: p.gold }].map(subject => { const minutes = subject.id ? studyMinutes(records, start, subject.id) : records.filter(r => r.kind === 'session' && !r.subjectId && r.date! >= start).reduce((sum, r) => sum + (r.minutes ?? 0), 0); return <View key={subject.id} style={{ gap: 9, paddingVertical: 8 }}><View style={ui.between}><Text style={ui.body}>{subject.title}</Text><Text style={ui.muted}>{minutes} min</Text></View><ProgressBar value={total ? minutes / total : 0} color={subject.color} label={`${subject.title} share of weekly study time`} /></View>; })}</Card>
    <Card><Text style={ui.heading}>Growing towards your goals</Text>{goals.length ? goals.map(goal => { const minutes = studyMinutes(records, goal.date ?? 0, goal.subjectId, goal.dueAt); return <View key={goal.id} style={{ gap: 9, paddingVertical: 8 }}><View style={ui.between}><Text style={[ui.body, { flex: 1 }]}>{goal.title}</Text><Badge label={`${Math.round(Math.min(100, minutes / goal.targetMinutes! * 100))}%`} tone={minutes >= goal.targetMinutes! ? 'green' : 'gold'} /></View><ProgressBar value={minutes / goal.targetMinutes!} label={goal.title} /><Text style={ui.muted}>{minutes} of {goal.targetMinutes} minutes</Text></View>; }) : <Text style={ui.muted}>Create a goal in your planner. Your saved focus sessions will count towards it automatically.</Text>}</Card>
  </View>;
}
