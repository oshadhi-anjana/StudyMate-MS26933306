import { StyleSheet } from 'react-native';
export const palette = {
  background: '#F7F8F3', surface: '#FFFFFF', ink: '#192E29', muted: '#65756D',
  primary: '#176B58', primaryDark: '#104D40', mint: '#E5F1EA', gold: '#A76E10',
  goldSoft: '#FFF2D4', border: '#E1E8E0', red: '#AD4944', redSoft: '#FBECE8',
  lavender: '#EEEAF7', purple: '#716098', blue: '#387D96',
};
export const ui = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  grow: { flex: 1 },
  title: { fontSize: 30, fontWeight: '800', color: palette.ink, letterSpacing: -1 },
  heading: { fontSize: 19, fontWeight: '700', color: palette.ink, letterSpacing: -0.3 },
  body: { fontSize: 15, lineHeight: 23, color: palette.ink },
  muted: { fontSize: 13, lineHeight: 20, color: palette.muted },
  eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1.8, color: palette.primary, textTransform: 'uppercase' },
  section: { gap: 16, marginBottom: 26 },
  divider: { height: 1, backgroundColor: palette.border, marginVertical: 12 },
});
