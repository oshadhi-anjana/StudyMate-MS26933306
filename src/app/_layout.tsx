import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StudyProvider } from '../state/StudyProvider';
export default function RootLayout() {
  return <SafeAreaProvider><StudyProvider><Stack screenOptions={{ headerShown: false, statusBarHidden: false }} /></StudyProvider></SafeAreaProvider>;
}
