import React from 'react';
import { View } from 'react-native';
import { Text } from './Typography';
import { ui, palette, sansFont } from './theme';
export function DateField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  const date = new Date(value);
  const local = new Date(value - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  return <View style={{ gap: 8 }}><Text style={ui.muted}>{label}</Text>{React.createElement('input', { type: 'datetime-local', 'aria-label': label, value: local, onChange: (event: React.ChangeEvent<HTMLInputElement>) => { const time = new Date(event.target.value).getTime(); if (Number.isFinite(time)) onChange(time); }, style: { fontFamily: sansFont, fontSize: 15, color: palette.ink, padding: 13, border: `1px solid ${palette.border}`, borderRadius: 12, background: '#FBFCFA', width: '100%', boxSizing: 'border-box' } })}</View>;
}
