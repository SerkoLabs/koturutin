import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { Button, Card, Screen, Spacer, Txt } from '@/ui/components';
import { spacing } from '@/ui/theme';
import { useAppState } from '@/state/AppState';

export default function Home() {
  const router = useRouter();
  const { t, priorityMoment, activeExperiment, lastOutcome, weeklyConsciousTransitions, openTransitionCard } =
    useAppState();

  async function onTryNow() {
    const attemptId = await openTransitionCard();
    if (attemptId) router.push({ pathname: '/card', params: { attemptId } });
  }

  return (
    <Screen>
      <Txt variant="label">{t('home.title')}</Txt>

      {/* North Star — real-life conscious transitions, not engagement */}
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: spacing.md }}>
          <Txt variant="title">{String(weeklyConsciousTransitions)}</Txt>
          <View style={{ flex: 1 }}>
            <Txt variant="subtitle">{t('home.northstar.label')}</Txt>
          </View>
        </View>
        <Txt variant="muted">{t('home.northstar.help')}</Txt>
      </Card>

      {/* Step 1: a confirmed transition moment */}
      {!priorityMoment ? (
        <Card onPress={() => router.push('/capture')}>
          <Txt variant="subtitle">{t('home.noMoment.title')}</Txt>
          <Txt variant="muted">{t('home.noMoment.body')}</Txt>
          <Spacer size={4} />
          <Button title={t('home.noMoment.cta')} onPress={() => router.push('/capture')} variant="secondary" />
        </Card>
      ) : (
        <Card>
          <Txt variant="label">{t('home.hasMoment.momentLabel')}</Txt>
          <Txt variant="subtitle">{priorityMoment.name}</Txt>
        </Card>
      )}

      {/* Step 2: one active experiment */}
      {priorityMoment ? (
        !activeExperiment ? (
          <Button title={t('home.selectExperiment.cta')} onPress={() => router.push('/select')} />
        ) : (
          <Card>
            <Txt variant="label">{t('home.hasExperiment.label')}</Txt>
            <Txt variant="body">{activeExperiment.ifThisThenThat.then}</Txt>
            <Spacer size={4} />
            <Button title={t('home.openCard.cta')} onPress={onTryNow} />
          </Card>
        )
      ) : null}

      {/* The persisted outcome is surfaced on reload (proof the loop's data round-trips). */}
      {lastOutcome ? (
        <Card>
          <Txt variant="label">{t('home.lastOutcome.label')}</Txt>
          <Txt variant="muted">
            {[
              lastOutcome.connectionFeeling !== null ? `${t('home.lastOutcome.connection')} ${lastOutcome.connectionFeeling}/10` : null,
              lastOutcome.craving !== null ? `${t('home.lastOutcome.craving')} ${lastOutcome.craving}/10` : null,
            ]
              .filter(Boolean)
              .join(' · ')}
          </Txt>
        </Card>
      ) : null}

      {priorityMoment ? (
        <Button title={t('home.observe.cta')} onPress={() => router.push('/observe')} variant="ghost" />
      ) : null}

      <Spacer size={8} />
      <Txt center variant="muted">{t('app.tagline')}</Txt>
      <Button title={t('home.week.cta')} onPress={() => router.push('/week')} variant="ghost" />
      <Button title={t('home.support.cta')} onPress={() => router.push('/safety')} variant="ghost" />
      <Button title={t('home.settings.cta')} onPress={() => router.push('/settings')} variant="ghost" />
    </Screen>
  );
}
