import { useRouter } from 'expo-router';
import { Button, Screen, Spacer, Txt } from '@/ui/components';
import { useAppState } from '@/state/AppState';

export default function Welcome() {
  const router = useRouter();
  const { t } = useAppState();
  return (
    <Screen>
      <Spacer size={24} />
      <Txt variant="label">{t('app.name')}</Txt>
      <Txt variant="title">{t('onb.welcome.title')}</Txt>
      <Txt variant="body">{t('onb.welcome.body')}</Txt>
      <Txt variant="muted">{t('onb.welcome.notWhat')}</Txt>
      <Spacer size={12} />
      <Button title={t('onb.welcome.cta')} onPress={() => router.push('/consent')} />
    </Screen>
  );
}
