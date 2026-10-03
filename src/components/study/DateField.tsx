import React, { useState } from 'react';
import { View } from 'react-native';
import { Text } from './Typography';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Button } from './Controls';
import { palette as p, ui } from './theme';
export function DateField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  const [mode, setMode] = useState<'date' | 'time' | null>(null);
  return <View style={{ gap: 8 }}><Text style={ui.muted}>{label}</Text><View style={ui.row}><Button icon="calendar" label={new Date(value).toLocaleDateString()} variant="secondary" onPress={() => setMode('date')} /><Button icon="clock-o" label={new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} variant="secondary" onPress={() => setMode('time')} /></View>
    {mode && <><DateTimePicker value={new Date(value)} mode={mode} accentColor={p.primary} themeVariant="light" textColor={p.ink} onChange={(event, date) => { setMode(null); if (event.type === 'set' && date) onChange(date.getTime()); }} /><Button small icon="check" label="Done" variant="ghost" onPress={() => setMode(null)} /></>}
  </View>;
}
