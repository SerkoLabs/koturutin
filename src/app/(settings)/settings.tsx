import { Alert, Share, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Card, Divider, Screen, Spacer, Toggle, Txt } from '@/ui/components';
import { spacing } from '@/ui/theme';
import { useAppState } from '@/state/AppState';

export default function Settings() {
  const router = useRouter();
  const { t, language, data, setLanguage, grantConsent, deleteAllData } = useAppState();
  const p = data.profile;

  async function onExport() {
    // Export is a client-side snapshot of the on-device document (local-first; nothing leaves the
    // device unless the user shares it). Free notes are included because they are the user's own data.
    try {
      await Share.share({ title: t('settings.export.title'), message: JSON.stringify(data, null, 2) });
    } catch {
      // sharing cancelled/unavailable — no-op
    }
  }

  function onDeleteAccount() {
    Alert.alert(t('settings.deleteAccount'), t('settings.deleteAccount.help'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('settings.deleteAccount.confirm'),
        style: 'destructive',
        onPress: async () => {
          await deleteAllData();
          router.replace('/welcome');
        },
      },
    ]);
  }

  function onWithdrawHealth() {
    Alert.alert(t('settings.health.withdraw'), t('onb.consent.declineNote'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('settings.health.withdraw'),
        style: 'destructive',
        onPress: async () => {
          await grantConsent({ consentHealthProcessing: false });
          router.replace('/welcome');
        },
      },
    ]);
  }

  return (
    <Screen>
      <Txt variant="title">{t('settings.title')}</Txt>

      {/* Language */}
      <Card>
        <Txt variant="label">{t('settings.language')}</Txt>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <View style={{ flex: 1 }}>
            <Button title={t('settings.language.tr')} onPress={() => setLanguage('tr')} variant={language === 'tr' ? 'primary' : 'secondary'} />
          </View>
          <View style={{ flex: 1 }}>
            <Button title={t('settings.language.en')} onPress={() => setLanguage('en')} variant={language === 'en' ? 'primary' : 'secondary'} />
          </View>
        </View>
      </Card>

      {/* Consents */}
      {p ? (
        <Card>
          <Txt variant="label">{t('settings.consents.title')}</Txt>
          <Txt variant="muted">{t('settings.health.on')}</Txt>
          <Divider />
          <Toggle label={t('onb.consent.personalization')} value={p.consentPersonalization} onToggle={() => grantConsent({ consentPersonalization: !p.consentPersonalization })} />
          <Toggle label={t('onb.consent.research')} value={p.consentResearch} onToggle={() => grantConsent({ consentResearch: !p.consentResearch })} />
          <Toggle label={t('onb.consent.freeText')} value={p.consentFreeTextToModel} onToggle={() => grantConsent({ consentFreeTextToModel: !p.consentFreeTextToModel })} />
          <Toggle label={t('onb.consent.analytics')} value={p.analyticsEnabled} onToggle={() => grantConsent({ analyticsEnabled: !p.analyticsEnabled })} />
        </Card>
      ) : null}

      {/* Optional wellbeing measure */}
      <Button title={t('settings.who5')} onPress={() => router.push('/who5')} variant="secondary" />

      {/* Data control */}
      <Button title={t('settings.export')} onPress={onExport} variant="secondary" />
      <Button title={t('settings.health.withdraw')} onPress={onWithdrawHealth} variant="danger" />
      <Button title={t('settings.deleteAccount')} onPress={onDeleteAccount} variant="danger" />
      <Txt variant="muted">{t('settings.deleteAccount.help')}</Txt>

      <Spacer size={spacing.sm} />
      <Button title={t('settings.back')} onPress={() => router.back()} variant="ghost" />
    </Screen>
  );
}
