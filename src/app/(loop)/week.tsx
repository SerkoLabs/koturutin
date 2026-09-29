import { useRouter } from 'expo-router';
import { Button, Card, Screen, Spacer, Txt } from '@/ui/components';
import { spacing } from '@/ui/theme';
import { useAppState } from '@/state/AppState';
import { format } from '@/i18n';

export default function Week() {
  const router = useRouter();
  const { t, language, weeklySummary: s, weeklyConsciousTransitions } = useAppState();

  return (
    <Screen>
      <Txt variant="title">{t('week.title')}</Txt>
      <Txt variant="muted">{t('week.body')}</Txt>

      <Card>
        <Txt variant="subtitle">{`${weeklyConsciousTransitions} · ${t('home.northstar.label')}`}</Txt>
      </Card>

      {s.hasData ? (
        <Card>
          <Txt variant="body">{format(language, 'week.chose', { n: s.did, m: s.offered })}</Txt>
          {s.connectionAvgOnDid !== null ? (
            <Txt variant="muted">{format(language, 'week.connection', { v: s.connectionAvgOnDid })}</Txt>
          ) : null}
          {s.cravingAvgOnDid !== null ? (
            <Txt variant="muted">{format(language, 'week.craving', { v: s.cravingAvgOnDid })}</Txt>
          ) : null}
        </Card>
      ) : (
        <Card>
          <Txt variant="body">{t('week.none')}</Txt>
        </Card>
      )}

      <Txt variant="muted">{t('week.next')}</Txt>
      <Spacer size={spacing.sm} />
      <Button title={t('common.back')} onPress={() => router.replace('/home')} variant="secondary" />
    </Screen>
  );
}
