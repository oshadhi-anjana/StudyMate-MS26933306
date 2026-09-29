import React, { useState } from 'react';
import { View, Text } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Button } from './Controls';
import { ui } from './theme';
export function DateField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  const [mode, setMode] = useState<'date' | 'time' | null>(null);
  return <View style={{ gap: 8 }}><Text style={ui.muted}>{label}</Text><View style={ui.row}><Button label={new Date(value).toLocaleDateString()} variant="secondary" onPress={() => setMode('date')} /><Button label={new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} variant="secondary" onPress={() => setMode('time')} /></View>
    {mode && <><DateTimePicker value={new Date(value)} mode={mode} onChange={(_, date) => { setMode(null); if (date) onChange(date.getTime()); }} /><Button small label="Done" variant="ghost" onPress={() => setMode(null)} /></>}
  </View>;
}
