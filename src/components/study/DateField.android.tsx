import React, { useState } from 'react';
import { View } from 'react-native';
import { Text } from './Typography';
import { DatePickerDialog, Host, TimePickerDialog } from '@expo/ui/jetpack-compose';
import { Button } from './Controls';
import { palette as p, ui } from './theme';

export function DateField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  const [mode, setMode] = useState<'date' | 'time' | null>(null);
  const date = new Date(value);
  const dismiss = () => setMode(null);
  // Material's calendar represents calendar days at UTC midnight, not local midnight.
  const calendarDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const selectDate = (selected: Date) => {
    const next = new Date(value);
    next.setFullYear(selected.getUTCFullYear(), selected.getUTCMonth(), selected.getUTCDate());
    dismiss();
    onChange(next.getTime());
  };
  const selectTime = (selected: Date) => {
    const next = new Date(value);
    next.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
    dismiss();
    onChange(next.getTime());
  };
  return <View style={{ gap: 8 }}>
    <Text style={ui.muted}>{label}</Text>
    <View style={ui.row}>
      <Button icon="calendar" label={date.toLocaleDateString()} variant="secondary" onPress={() => setMode('date')} />
      <Button icon="clock-o" label={date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} variant="secondary" onPress={() => setMode('time')} />
    </View>
    {mode && <Host colorScheme="light" seedColor={p.primary}>
      {mode === 'date' ? <DatePickerDialog initialDate={calendarDate.toISOString()} color={p.primary}
        elementColors={{ containerColor: p.background, titleContentColor: p.primary, headlineContentColor: p.ink, navigationContentColor: p.primary, selectedDayContainerColor: p.primary, selectedDayContentColor: p.surface, selectedYearContainerColor: p.primary, selectedYearContentColor: p.surface, todayContentColor: p.primary, todayDateBorderColor: p.primary, currentYearContentColor: p.primary, dividerColor: p.border }}
        confirmButtonLabel="Done" dismissButtonLabel="Cancel" onDateSelected={selectDate} onDismissRequest={dismiss} />
        : <TimePickerDialog initialDate={date.toISOString()} color={p.primary} is24Hour={false}
          elementColors={{ containerColor: p.background, clockDialColor: p.mint, selectorColor: p.primary, clockDialSelectedContentColor: p.surface, clockDialUnselectedContentColor: p.ink, timeSelectorSelectedContainerColor: p.primary, timeSelectorSelectedContentColor: p.surface, timeSelectorUnselectedContainerColor: p.mint, timeSelectorUnselectedContentColor: p.ink, periodSelectorSelectedContainerColor: p.primary, periodSelectorSelectedContentColor: p.surface, periodSelectorUnselectedContainerColor: p.background, periodSelectorUnselectedContentColor: p.ink, periodSelectorBorderColor: p.border }}
          confirmButtonLabel="Done" dismissButtonLabel="Cancel" onDateSelected={selectTime} onDismissRequest={dismiss} />}
    </Host>}
  </View>;
}
