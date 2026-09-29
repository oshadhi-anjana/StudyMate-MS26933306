import React, { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { createUserWithEmailAndPassword, sendPasswordResetEmail, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth } from '../services/auth';
import { friendlyError } from '../services/errors';
import { Button, Field, Message, Badge } from '../components/study/Controls';
import { palette as p, ui } from '../components/study/theme';
import { useStudy } from '../state/StudyProvider';

export function AuthScreen() {
  const { enterDemo, sessionNotice } = useStudy();
  const wide = useWindowDimensions().width >= 900;
  const [mode, setMode] = useState<'login' | 'register' | 'reset'>('login');
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [name, setName] = useState('');
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState(''); const [error, setError] = useState('');
  const submit = async () => {
    setError(''); setMessage('');
    if (!email.trim() || (mode !== 'reset' && !password)) { setError('Enter your email and password to continue.'); return; }
    if (mode === 'register' && (!name.trim() || password.length < 8)) { setError('Enter your name and a password of at least 8 characters.'); return; }
    setBusy(true);
    try {
      if (mode === 'reset') { await sendPasswordResetEmail(auth, email.trim()); setMessage('If this email has an account, a reset link will arrive shortly.'); }
      else if (mode === 'register') { const result = await createUserWithEmailAndPassword(auth, email.trim(), password); await updateProfile(result.user, { displayName: name.trim() }); }
      else await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (e) { setError(friendlyError(e)); } finally { setBusy(false); }
  };
  const changeMode = (value: typeof mode) => { setMode(value); setError(''); setMessage(''); };
  return <SafeAreaView style={{ flex: 1, backgroundColor: p.background }}><KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1 }}><View style={{ flex: 1, flexDirection: wide ? 'row' : 'column', minHeight: wide ? 750 : undefined }}>
    <View style={{ flex: wide ? 1.05 : undefined, backgroundColor: p.primaryDark, padding: wide ? 65 : 28, justifyContent: 'center', gap: 26 }}>
      <View style={{ backgroundColor: 'white', borderRadius: 20, width: 100, height: 100, overflow: 'hidden' }}><Image source={require('../../assets/images/studymate-logo.png')} style={{ width: 100, height: 100 }} resizeMode="contain" accessibilityLabel="StudyMate logo" /></View>
      <Text style={{ color: '#B9D9BF', fontSize: 12, fontWeight: '700', letterSpacing: 3 }}>A LITTLE FOCUS. A BIG FUTURE.</Text>
      <Text style={{ fontSize: wide ? 56 : 34, lineHeight: wide ? 63 : 41, fontWeight: '800', color: '#F9F8E9', letterSpacing: -1.5 }}>Make room for{`\n`}your next{`\n`}bright idea.</Text>
      <Text style={{ fontSize: 17, lineHeight: 28, color: '#CCE1D6', maxWidth: 380 }}>Your classes, deadlines and study goals. One calm place to bring it all together.</Text>
      {wide && <View style={{ gap: 16, marginTop: 25 }}>{['Plan your week with confidence', 'Build focus, one session at a time', 'Keep learning, even when offline'].map((text, i) => <View style={ui.row} key={text}><Text style={{ color: '#E7C579', fontSize: 19 }}>0{i + 1}</Text><Text style={{ color: '#F6F4E9', fontSize: 14 }}>{text}</Text></View>)}</View>}
    </View>
    <View style={{ flex: 1, padding: wide ? 64 : 28, justifyContent: 'center', alignItems: 'center' }}><View style={{ width: '100%', maxWidth: 410, gap: 20 }}>
      <Badge label="YOUR PERSONAL STUDY COMPANION" />
      <View style={{ gap: 8 }}><Text style={[ui.title, { fontSize: 34 }]}>{mode === 'register' ? 'A fresh start.' : mode === 'reset' ? 'Let’s get you back.' : 'Welcome back.'}</Text><Text style={ui.muted}>{mode === 'register' ? 'Create your account and make a little progress every day.' : mode === 'reset' ? 'We’ll send you a link to reset your password.' : 'Good things begin with a small plan. Sign in to yours.'}</Text></View>
      {mode === 'register' && <Field label="Your name" value={name} onChangeText={setName} placeholder="e.g. Oshadhi" autoComplete="name" maxLength={80} />}
      <Field label="Email address" value={email} onChangeText={setEmail} placeholder="you@example.com" autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
      {mode !== 'reset' && <Field label="Password" value={password} onChangeText={setPassword} placeholder={mode === 'register' ? 'At least 8 characters' : 'Enter your password'} secureTextEntry autoComplete={mode === 'register' ? 'new-password' : 'current-password'} onSubmitEditing={() => void submit()} />}
      <Message text={sessionNotice} error /><Message text={error} error /><Message text={message} />
      <Button label={mode === 'register' ? 'Create my account  →' : mode === 'reset' ? 'Send reset link' : 'Sign in  →'} onPress={() => void submit()} busy={busy} />
      {mode === 'login' && <Button label="Forgot password?" variant="ghost" onPress={() => changeMode('reset')} />}
      <View style={{ height: 1, backgroundColor: p.border }} /><Text style={[ui.muted, { textAlign: 'center' }]}>{mode === 'login' ? 'New to StudyMate?' : 'Already have an account?'}</Text>
      <Button label={mode === 'login' ? 'Create an account' : 'Back to sign in'} variant="secondary" onPress={() => changeMode(mode === 'login' ? 'register' : 'login')} disabled={busy} />
      <Text style={[ui.muted, { textAlign: 'center', fontSize: 11 }]}>Learn today. Grow tomorrow.</Text>
      <Button label="Explore a local demo" variant="ghost" onPress={enterDemo} disabled={busy} />
    </View></View>
  </View></ScrollView></KeyboardAvoidingView></SafeAreaView>;
}
