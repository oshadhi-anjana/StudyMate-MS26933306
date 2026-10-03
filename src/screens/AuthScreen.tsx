import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, useWindowDimensions, View } from 'react-native';
import { Text } from '../components/study/Typography';
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
  return <SafeAreaView style={{ flex: 1, backgroundColor: p.background }}><KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1 }}><View style={{ flex: 1, justifyContent: 'center' }}>
    <View style={{ flex: 1, padding: wide ? 64 : 28, justifyContent: 'center', alignItems: 'center' }}><View style={{ width: '100%', maxWidth: 410, gap: 20 }}>
      {/* <Badge label="YOUR PERSONAL STUDY COMPANION" /> */}
      <View style={{ gap: 8 }}><Text style={[ui.title, { fontSize: 34 }]}>{mode === 'register' ? 'A fresh start.' : mode === 'reset' ? 'Let’s get you back.' : 'Welcome back.'}</Text><Text style={ui.muted}>{mode === 'register' ? 'Create your account and make a little progress every day.' : mode === 'reset' ? 'We’ll send you a link to reset your password.' : 'Good things begin with a small plan. Sign in to yours.'}</Text></View>
      {mode === 'register' && <Field label="Your name" value={name} onChangeText={setName} placeholder="e.g. Oshadhi" autoComplete="name" maxLength={80} />}
      <Field label="Email address" value={email} onChangeText={setEmail} placeholder="you@example.com" autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
      {mode !== 'reset' && <Field key={mode} label="Password" value={password} onChangeText={setPassword} placeholder={mode === 'register' ? 'At least 8 characters' : 'Enter your password'} secureTextEntry autoComplete={mode === 'register' ? 'new-password' : 'current-password'} onSubmitEditing={() => void submit()} />}
      <Message text={sessionNotice} error /><Message text={error} error /><Message text={message} />
      <Button icon={mode === 'register' ? 'user-plus' : mode === 'reset' ? 'envelope' : 'sign-in'} label={mode === 'register' ? 'Create my account' : mode === 'reset' ? 'Send reset link' : 'Sign in'} onPress={() => void submit()} busy={busy} />
      {mode === 'login' && <Button icon="key" label="Forgot password?" variant="ghost" onPress={() => changeMode('reset')} />}
      <View style={{ height: 1, backgroundColor: p.border }} /><Text style={[ui.muted, { textAlign: 'center' }]}>{mode === 'login' ? 'New to StudyMate?' : 'Already have an account?'}</Text>
      <Button icon={mode === 'login' ? 'user-plus' : 'sign-in'} label={mode === 'login' ? 'Create an account' : 'Back to sign in'} variant="secondary" onPress={() => changeMode(mode === 'login' ? 'register' : 'login')} disabled={busy} />
      <Text style={[ui.muted, { textAlign: 'center', fontSize: 11 }]}>Learn today. Grow tomorrow.</Text>
      <Button icon="compass" label="Explore a local demo" variant="ghost" onPress={enterDemo} disabled={busy} />
    </View></View>
  </View></ScrollView></KeyboardAvoidingView></SafeAreaView>;
}
