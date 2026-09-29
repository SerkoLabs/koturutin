import { useRouter } from 'expo-router';
import { Button, Card, Screen, Spacer, Txt } from '@/ui/components';
import { useAppState } from '@/state/AppState';

export default function Safety() {
  const router = useRouter();
  const { t } = useAppState();
  return (
    <Screen>
      <Txt variant="title">{t('support.title')}</Txt>
      <Txt variant="muted">{t('support.body')}</Txt>

      <Card>
        <Txt variant="subtitle">{t('support.crisis.title')}</Txt>
        <Txt variant="body">{t('support.crisis.body')}</Txt>
      </Card>

      <Card>
        <Txt variant="subtitle">{t('support.smoking.title')}</Txt>
        <Txt variant="body">{t('support.smoking.body')}</Txt>
      </Card>

      <Card>
        <Txt variant="subtitle">{t('support.relationship.title')}</Txt>
        <Txt variant="body">{t('support.relationship.body')}</Txt>
      </Card>

      <Spacer size={8} />
      <Button title={t('support.back')} onPress={() => router.replace('/home')} variant="secondary" />
    </Screen>
  );
}
