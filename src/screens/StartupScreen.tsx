import React from 'react';
import { ActivityIndicator, Image, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Button, Message } from '../components/study/Controls';
import { palette as p, ui } from '../components/study/theme';

export function StartupScreen({ error, onBackToSignIn }: { error?: string; onBackToSignIn: () => void }) {
  const wide = useWindowDimensions().width >= 900;
  return <SafeAreaView style={{ flex: 1, backgroundColor: p.primaryDark }}>
    <StatusBar style="light" />
    <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: wide ? 65 : 28 }}>
      <View style={{ width: '100%', maxWidth: 560, alignSelf: 'center', gap: 26 }}>
        <View style={{ backgroundColor: 'white', borderRadius: 20, width: 100, height: 100, overflow: 'hidden' }}>
          <Image source={require('../../assets/images/studymate-logo.png')} style={{ width: 100, height: 100 }} resizeMode="contain" accessibilityLabel="StudyMate logo" />
        </View>
        <Text style={{ color: '#B9D9BF', fontSize: 12, fontWeight: '700', letterSpacing: 3 }}>A LITTLE FOCUS. A BIG FUTURE.</Text>
        <Text style={{ fontSize: wide ? 56 : 34, lineHeight: wide ? 63 : 41, fontWeight: '800', color: '#F9F8E9', letterSpacing: -1.5 }}>Make room for{`\n`}your next{`\n`}bright idea.</Text>
        <Text style={{ fontSize: 17, lineHeight: 28, color: '#CCE1D6', maxWidth: 380 }}>Your classes, deadlines and study goals. One calm place to bring it all together.</Text>
        {wide && <View style={{ gap: 16, marginTop: 25 }}>{['Plan your week with confidence', 'Build focus, one session at a time', 'Keep learning, even when offline'].map((text, i) => <View style={ui.row} key={text}><Text style={{ color: '#E7C579', fontSize: 19 }}>0{i + 1}</Text><Text style={{ color: '#F6F4E9', fontSize: 14 }}>{text}</Text></View>)}</View>}
        <View style={{ gap: 12, marginTop: 16 }}>
          <ActivityIndicator color="#B9D9BF" accessibilityLabel="Loading StudyMate" />
          <Text style={{ color: '#CCE1D6', fontSize: 13, textAlign: 'center' }}>Making a little space for your plans…</Text>
          <Message text={error || ''} error />
          {!!error && <Button label="Back to sign in" variant="secondary" onPress={onBackToSignIn} />}
        </View>
      </View>
    </ScrollView>
  </SafeAreaView>;
}
