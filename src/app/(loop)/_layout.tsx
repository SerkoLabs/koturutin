import { Redirect, Stack } from 'expo-router';
import { View } from 'react-native';
import { useAppState } from '@/state/AppState';

/**
 * Route guard for the whole loop group: no loop screen is reachable (including via a deep link such
 * as koturutin://outcome?attemptId=…) unless the user is 18+ and has granted the required
 * health-processing consent (spine §21 R2/R6). Fail-closed to onboarding.
 */
export default function LoopLayout() {
  const { loading, canEnterLoop } = useAppState();
  if (loading) return <View />;
  if (!canEnterLoop) return <Redirect href="/welcome" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
