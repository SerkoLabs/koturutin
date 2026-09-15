import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button, Card, Screen, Spacer, Txt } from '@/ui/components';
import { useAppState } from '@/state/AppState';

export default function TransitionCard() {
  const router = useRouter();
  const { attemptId } = useLocalSearchParams<{ attemptId: string }>();
  const { t, activeExperiment, respondToCard } = useAppState();

  // Sensitive detail is resolved in-app only (never on the lock screen / in the notification).
  const description = activeExperiment?.ifThisThenThat.then ?? '';

  async function onDo() {
    if (!attemptId) return;
    await respondToCard(attemptId, 'did');
    router.replace({ pathname: '/outcome', params: { attemptId } });
  }
  async function onLater() {
    if (!attemptId) return;
    await respondToCard(attemptId, 'not_now');
    router.replace('/home');
  }
  async function onNotSuitable() {
    if (!attemptId) return;
    await respondToCard(attemptId, 'declined');
    router.replace('/home');
  }

  return (
    <Screen>
      <Txt variant="label">{t('card.title')}</Txt>
      <Txt variant="title">{t('card.body')}</Txt>
      <Card>
        <Txt variant="body">{description}</Txt>
      </Card>
      <Spacer size={8} />
      <Button title={t('card.do')} onPress={onDo} />
      <Button title={t('card.later')} onPress={onLater} variant="secondary" />
      <Button title={t('card.notSuitable')} onPress={onNotSuitable} variant="ghost" />
      <Txt variant="muted">{t('card.laterNote')}</Txt>
    </Screen>
  );
}
