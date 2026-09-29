import { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppStateProvider, useAppState } from '@/state/AppState';

/**
 * Resolves a right-moment notification tap into the in-app transition card (TASK-190). The
 * notification payload is opaque; the real content is resolved here, after the app is opened, by
 * creating the attempt for the active experiment and routing to S-06 (spine §10/§11 reveal-after-open).
 */
function NotificationRouter() {
  const router = useRouter();
  const { openTransitionCard } = useAppState();
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(() => {
      void (async () => {
        const attemptId = await openTransitionCard();
        if (attemptId) router.push({ pathname: '/card', params: { attemptId } });
      })();
    });
    return () => sub.remove();
  }, [openTransitionCard, router]);
  return null;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppStateProvider>
        <StatusBar style="auto" />
        <NotificationRouter />
        <Stack screenOptions={{ headerShown: false }} />
      </AppStateProvider>
    </SafeAreaProvider>
  );
}
