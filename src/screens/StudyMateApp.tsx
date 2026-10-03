import { Icon } from '../components/study/Icon';
import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { AppState, Image, Platform, Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import { Text } from '../components/study/Typography';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStudy } from '../state/StudyProvider';
import { StartupScreen } from './StartupScreen';
import { AuthScreen } from './AuthScreen';
import { DashboardScreen } from './DashboardScreen';
import { PlannerScreen } from './PlannerScreen';
import { FocusScreen } from './FocusScreen';
import { ProgressScreen } from './ProgressScreen';
import { ProfileScreen } from './ProfileScreen';
import { RecordEditor } from './RecordEditor';
import { Kind, StudyRecord } from '../domain/models';
import { Button, ConfirmDialog, Message } from '../components/study/Controls';
import { palette as p, ui } from '../components/study/theme';
import { friendlyError } from '../services/errors';

const navigation = [
  { label: 'Home', icon: 'home' }, { label: 'Planner', icon: 'calendar' },
  { label: 'Focus', icon: 'clock-o' }, { label: 'Progress', icon: 'line-chart' }, { label: 'Profile', icon: 'user' },
] as const;
export default function StudyMate() {
  const { user, authReady, ready } = useStudy();
  const insets = useSafeAreaInsets();
  const [startupComplete, setStartupComplete] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setStartupComplete(true), 3000);
    return () => clearTimeout(timer);
  }, []);
  const loading = !startupComplete || !authReady || (!!user && !ready);
  // Expo Go can retain a black native status-bar background on Android.
  // Keep white icons there and paint a matching dark inset for edge-to-edge devices.
  const style = Platform.OS === 'android' || loading ? 'light' : 'dark';
  useEffect(() => {
    const applyStatusBar = () => {
      StatusBar.setHidden(false);
      StatusBar.setStyle(style);
    };
    const frame = requestAnimationFrame(applyStatusBar);
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') applyStatusBar();
    });
    return () => {
      cancelAnimationFrame(frame);
      subscription.remove();
    };
  }, [style]);
  return <View style={{ flex: 1 }}>
    <Stack.Screen options={{ statusBarHidden: false, statusBarStyle: style }} />
    <StatusBar hidden={false} style={style} />
    <StudyMateContent loading={loading} />
    {Platform.OS === 'android' && <View pointerEvents="none" accessible={false} style={{ position: 'absolute', top: 0, left: 0, right: 0, height: insets.top, backgroundColor: p.primaryDark }} />}
  </View>;
}

function StudyMateContent({ loading }: { loading: boolean }) {
  const { user, demo, profile, pending, syncing, online, error: cloudError, remove, logout } = useStudy();
  const wide = useWindowDimensions().width >= 900;
  const [tab, setTab] = useState('Home');
  const [editor, setEditor] = useState<{ kind: Kind; record?: StudyRecord } | null>(null);
  const [deleting, setDeleting] = useState<StudyRecord | null>(null);
  const [error, setError] = useState('');
  const scroll = useRef<ScrollView>(null);
  useEffect(() => { scroll.current?.scrollTo({ y: 0, animated: false }); setError(''); }, [tab]);
  useEffect(() => { setTab('Home'); setEditor(null); setDeleting(null); setError(''); }, [user?.uid]);
  const onError = (value: unknown) => setError(friendlyError(value));
  if (loading) return <StartupScreen error={cloudError || error} onBackToSignIn={() => { void logout().catch(onError); }} />;
  if (!user) return <AuthScreen />;
  const onAdd = (kind: Kind) => setEditor({ kind });
  const onEdit = (record: StudyRecord) => setEditor({ kind: record.kind, record });
  const firstName = (profile?.title || user.displayName || 'Student').split(' ')[0];
  const status = demo ? 'Local demo · no cloud sync' : !online ? 'Offline · saved on device' : syncing ? 'Syncing your planner…' : pending ? `${pending} changes waiting to sync` : cloudError ? 'Cloud sync needs attention' : 'Your planner is up to date';
  return <SafeAreaView style={{ flex: 1, backgroundColor: p.background }} edges={['top', 'bottom']}><View style={{ flex: 1, flexDirection: 'row' }}>
    {wide && <View style={{ width: 232, borderRightWidth: 1, borderRightColor: p.border, backgroundColor: '#FCFDF9', padding: 22, gap: 28 }}>
      <View style={{ alignItems: 'center', paddingTop: 8 }}><Image source={require('../../assets/images/studymate-logo.png')} style={{ width: 145, height: 145 }} resizeMode="contain" accessibilityLabel="StudyMate: Learn Today, Grow Tomorrow" /></View>
      <View style={{ gap: 8 }}><Text style={[ui.eyebrow, { color: '#93A096', paddingLeft: 14, marginBottom: 7 }]}>YOUR STUDY SPACE</Text>{navigation.map(item => <Pressable key={item.label} onPress={() => setTab(item.label)} accessibilityRole="tab" accessibilityState={{ selected: tab === item.label }} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 13, padding: 14, borderRadius: 12, backgroundColor: tab === item.label ? p.primary : pressed ? p.mint : 'transparent' })}><Icon name={item.icon} size={23} color={tab === item.label ? 'white' : p.muted} style={{ width: 25, textAlign: 'center' }} /><Text style={{ fontSize: 14, fontWeight: '600', color: tab === item.label ? 'white' : p.muted }}>{item.label}</Text></Pressable>)}</View>
      <View style={{ flex: 1 }} /><View style={{ padding: 17, backgroundColor: '#EFF3E7', borderRadius: 16, gap: 9 }}><Icon name="star" color={p.gold} size={24} /><Text style={{ color: p.primary, fontSize: 14, fontWeight: '700' }}>Progress, not perfection.</Text><Text style={ui.muted}>Every small step is a step forward. You’ve got this.</Text></View>
      <Pressable onPress={() => setTab('Profile')} accessibilityRole="button" style={ui.row}><View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: p.goldSoft, justifyContent: 'center', alignItems: 'center' }}><Text style={{ color: p.gold, fontWeight: '700' }}>{firstName[0].toUpperCase()}</Text></View><View style={{ flex: 1 }}><Text style={{ color: p.ink, fontWeight: '600', fontSize: 13 }}>{firstName}</Text><Text style={[ui.muted, { fontSize: 11 }]}>Your personal space</Text></View><Icon name="chevron-right" color={p.muted} size={14} /></Pressable>
    </View>}
    <View style={{ flex: 1 }}><View style={{ paddingHorizontal: wide ? 34 : 20, minHeight: wide ? 72 : 62, backgroundColor: '#FFFFFFCC', borderBottomWidth: 1, borderBottomColor: p.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
      {wide ? <Text style={ui.muted}>My workspace <Text style={{ color: p.ink }}> / {tab}</Text></Text> : <View style={[ui.row, { gap: 8 }]}><Image source={require('../../assets/images/studymate-logo.png')} style={{ width: 38, height: 38 }} resizeMode="contain" /><Text style={{ fontSize: 18, color: p.ink, fontWeight: '800', letterSpacing: -0.6 }}>StudyMate</Text></View>}
      <Pressable onPress={() => setTab('Profile')} accessibilityRole="button" accessibilityLabel={status} style={[ui.row, { gap: 7, flexShrink: 1 }]}><View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: demo || !online || pending || cloudError ? p.gold : p.primary }} /><Text style={{ color: p.muted, fontSize: 11, flexShrink: 1 }}>{wide ? status : demo ? 'Local demo' : !online ? 'Offline' : syncing ? 'Syncing' : pending ? `${pending} pending` : cloudError ? 'Sync issue' : 'Synced'}</Text></Pressable>
    </View>
    <ScrollView ref={scroll} keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: wide ? 34 : 20, paddingBottom: 40 }}><View style={{ width: '100%', maxWidth: 1180, alignSelf: 'center', gap: 16 }}>
      {demo && <Message text="You’re exploring a local demo. Changes stay on this device. Sign out in Profile to create or access your Firebase account." />}
      {!!cloudError && <Message text={cloudError} error />}{!!error && <View style={{ gap: 6 }}><Message text={error} error /><Button icon="times" label="Dismiss" small variant="ghost" onPress={() => setError('')} /></View>}
      {tab === 'Home' && <DashboardScreen onAdd={onAdd} navigate={setTab} />}
      {tab === 'Planner' && <PlannerScreen onAdd={onAdd} onEdit={onEdit} onDelete={setDeleting} onError={onError} />}
      <View style={{ display: tab === 'Focus' ? 'flex' : 'none' }}><FocusScreen key={user.uid} /></View>
      {tab === 'Progress' && <ProgressScreen />}{tab === 'Profile' && <ProfileScreen />}
      <Text style={{ color: '#96A199', fontSize: 11, textAlign: 'center', marginTop: 25 }}>Made for your next chapter.  ·  StudyMate</Text>
    </View></ScrollView>
    {!wide && <View style={{ flexDirection: 'row', backgroundColor: 'white', paddingVertical: 8, borderTopWidth: 1, borderTopColor: p.border }}>{navigation.map(item => <Pressable key={item.label} onPress={() => setTab(item.label)} accessibilityRole="tab" accessibilityState={{ selected: tab === item.label }} accessibilityLabel={item.label} style={{ flex: 1, minHeight: 50, alignItems: 'center', justifyContent: 'center', gap: 4 }}><Icon name={item.icon} size={23} color={tab === item.label ? p.primary : '#97A198'} /><Text style={{ fontSize: 10, fontWeight: tab === item.label ? '800' : '500', color: tab === item.label ? p.primary : p.muted }}>{item.label}</Text></Pressable>)}</View>}
    </View>
  </View>{editor && <RecordEditor kind={editor.kind} record={editor.record} onClose={() => setEditor(null)} />}{deleting && <ConfirmDialog title={`Delete “${deleting.title}”?`} description="This removes the item from your planner and syncs the deletion to your account when you’re online." onClose={() => setDeleting(null)} onConfirm={() => remove(deleting)} />}</SafeAreaView>;
}
