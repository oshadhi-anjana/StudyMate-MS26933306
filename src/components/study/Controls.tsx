import React from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, TextInputProps, View, ViewStyle, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon, IconName } from './Icon';
import { palette as p, ui } from './theme';

export function Button({ label, onPress, variant = 'primary', busy, disabled, small = false, icon }: {
  label: string; onPress: () => void; variant?: 'primary' | 'secondary' | 'ghost' | 'danger'; busy?: boolean; disabled?: boolean; small?: boolean; icon?: IconName;
}) {
  const color = variant === 'primary' ? 'white' : variant === 'danger' ? p.red : p.primary;
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled: disabled || busy }} disabled={disabled || busy} onPress={onPress}
    style={({ pressed }) => [styles.button, small && { minHeight: 38, paddingHorizontal: 14 }, { backgroundColor: variant === 'primary' ? p.primary : variant === 'danger' ? p.redSoft : variant === 'secondary' ? p.mint : 'transparent', opacity: disabled || busy ? 0.5 : pressed ? 0.75 : 1 }]}>
    {busy ? <ActivityIndicator color={variant === 'primary' ? 'white' : p.primary} /> : <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, flexShrink: 1 }}>{icon && <Icon name={icon} size={small ? 14 : 16} color={color} />}<Text style={{ color, fontSize: small ? 13 : 14, fontWeight: '700', flexShrink: 1 }}>{label}</Text></View>}
  </Pressable>;
}
export function Field({ label, hint, secureTextEntry, ...props }: TextInputProps & { label: string; hint?: string }) {
  const [passwordVisible, setPasswordVisible] = React.useState(false);
  return <View style={{ gap: 7 }}><Text style={styles.label}>{label}</Text><View>
    <TextInput accessibilityLabel={label} placeholderTextColor="#909C95" {...props}
      secureTextEntry={!!secureTextEntry && !passwordVisible}
      style={[styles.input, props.multiline && { minHeight: 110, textAlignVertical: 'top' }, props.style, secureTextEntry && { paddingRight: 58 }]} />
    {secureTextEntry && <Pressable accessibilityRole="button" accessibilityLabel={passwordVisible ? 'Hide password' : 'Show password'} accessibilityState={{ disabled: props.editable === false }} disabled={props.editable === false} onPress={() => setPasswordVisible(value => !value)} style={({ pressed }) => ({ position: 'absolute', right: 2, top: 2, bottom: 2, width: 48, minHeight: 44, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}>
      <Icon name={passwordVisible ? 'eye-slash' : 'eye'} size={21} color={p.primary} />
    </Pressable>}
  </View>{hint && <Text style={ui.muted}>{hint}</Text>}</View>;
}
export function Card({ children, style }: React.PropsWithChildren<{ style?: ViewStyle }>) { return <View style={[styles.card, style]}>{children}</View>; }
export function Badge({ label, tone = 'green' }: { label: string; tone?: 'green' | 'gold' | 'red' | 'purple' }) {
  const colors = { green: [p.mint, p.primary], gold: [p.goldSoft, p.gold], red: [p.redSoft, p.red], purple: [p.lavender, p.purple] }[tone];
  return <View style={{ alignSelf: 'flex-start', paddingVertical: 5, paddingHorizontal: 9, borderRadius: 7, backgroundColor: colors[0] }}><Text style={{ fontSize: 11, fontWeight: '700', color: colors[1] }}>{label}</Text></View>;
}
export function Chips({ options, value, onChange }: { options: { label: string; value: string }[]; value: string; onChange: (value: string) => void }) {
  return <View style={[ui.row, { gap: 8 }]}>{options.map(option => <Pressable key={option.value} onPress={() => onChange(option.value)} accessibilityRole="button" accessibilityState={{ selected: value === option.value }} style={[styles.chip, value === option.value && { borderColor: p.primary, backgroundColor: p.mint }]}>
    <Text style={{ color: value === option.value ? p.primary : p.muted, fontSize: 13, fontWeight: value === option.value ? '700' : '500' }}>{option.label}</Text>
  </Pressable>)}</View>;
}
export function ProgressBar({ value, color = p.primary, label }: { value: number; color?: string; label: string }) {
  const percent = Math.max(0, Math.min(100, Math.round(value * 100)));
  return <View accessibilityRole="progressbar" accessibilityLabel={label} accessibilityValue={{ min: 0, max: 100, now: percent }} style={{ height: 7, borderRadius: 10, backgroundColor: p.border, overflow: 'hidden' }}><View style={{ height: '100%', width: `${percent}%`, backgroundColor: color, borderRadius: 10 }} /></View>;
}
export function Check({ checked, onPress, label }: { checked: boolean; onPress: () => void; label: string }) {
  return <Pressable accessibilityRole="checkbox" accessibilityState={{ checked }} accessibilityLabel={label} onPress={onPress} style={{ padding: 9, margin: -5 }}><View style={{ width: 23, height: 23, borderWidth: 1.5, borderColor: checked ? p.primary : '#AEBFB3', backgroundColor: checked ? p.primary : 'transparent', borderRadius: 7, alignItems: 'center', justifyContent: 'center' }}>{checked && <Icon name="check" size={14} color="white" />}</View></Pressable>;
}
export function EmptyState({ title, detail, action, onAction }: { title: string; detail: string; action?: string; onAction?: () => void }) {
  return <Card style={{ alignItems: 'center', paddingVertical: 32, gap: 12 }}><View style={styles.emptyIcon}><Icon name="star" size={27} color={p.primary} /></View><Text style={ui.heading}>{title}</Text><Text style={[ui.muted, { textAlign: 'center', maxWidth: 360 }]}>{detail}</Text>{action && onAction && <Button icon="arrow-right" label={action} onPress={onAction} variant="secondary" />}</Card>;
}
export function Message({ text, error = false }: { text: string; error?: boolean }) {
  if (!text) return null;
  return <View accessibilityRole="alert" style={{ padding: 13, borderRadius: 12, backgroundColor: error ? p.redSoft : p.mint }}><Text style={{ fontSize: 13, lineHeight: 20, color: error ? p.red : p.primary }}>{text}</Text></View>;
}
export function Sheet({ title, children, onClose }: React.PropsWithChildren<{ title: string; onClose: () => void }>) {
  return <Modal visible animationType="fade" transparent onRequestClose={onClose}><KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.overlay}><SafeAreaView style={styles.modalSafe}><View style={styles.sheet}>
    <View style={[ui.between, { padding: 22, borderBottomWidth: 1, borderBottomColor: p.border }]}><Text style={ui.heading}>{title}</Text><Button icon="times" label="Close" onPress={onClose} variant="ghost" small /></View>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 22, gap: 18 }}>{children}</ScrollView>
  </View></SafeAreaView></KeyboardAvoidingView></Modal>;
}
export function ConfirmDialog({ title, description, onConfirm, onClose }: { title: string; description: string; onConfirm: () => Promise<void>; onClose: () => void }) {
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');
  return <Sheet title={title} onClose={() => { if (!busy) onClose(); }}><Text style={ui.body}>{description}</Text><Message text={error} error /><View style={ui.row}><Button icon="times" label="Cancel" variant="secondary" onPress={onClose} disabled={busy} /><Button icon="check" label="Confirm" variant="danger" busy={busy} onPress={() => { setBusy(true); void onConfirm().then(onClose).catch(e => { setError(e.message); setBusy(false); }); }} /></View></Sheet>;
}
const styles = StyleSheet.create({
  button: { minHeight: 46, paddingHorizontal: 20, paddingVertical: 11, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  label: { color: p.ink, fontSize: 13, fontWeight: '600' },
  input: { minHeight: 48, borderRadius: 12, borderWidth: 1, borderColor: p.border, backgroundColor: '#FBFCFA', color: p.ink, fontSize: 15, paddingHorizontal: 14, paddingVertical: 12 },
  card: { backgroundColor: p.surface, borderWidth: 1, borderColor: p.border, borderRadius: 18, padding: 20, gap: 12 },
  chip: { paddingVertical: 10, paddingHorizontal: 14, minHeight: 40, borderWidth: 1, borderColor: p.border, backgroundColor: 'white', borderRadius: 10 },
  emptyIcon: { width: 54, height: 54, backgroundColor: p.mint, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  overlay: { flex: 1, backgroundColor: '#0B211BAA', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalSafe: { width: '100%', maxWidth: 600, maxHeight: '95%' },
  sheet: { backgroundColor: p.surface, borderRadius: 22, overflow: 'hidden', maxHeight: '100%' },
});
