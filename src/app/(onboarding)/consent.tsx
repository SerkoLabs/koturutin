import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Button, Card, Divider, Screen, Spacer, Toggle, Txt } from '@/ui/components';
import { useAppState } from '@/state/AppState';
import type { MessageKey } from '@/i18n';

export default function Consent() {
  const router = useRouter();
  const { t, grantConsent } = useAppState();
  const [age, setAge] = useState(false);
  const [health, setHealth] = useState(false);
  const [personalization, setPersonalization] = useState(false);
  const [research, setResearch] = useState(false);
  const [freeText, setFreeText] = useState(false);
  const [analytics, setAnalytics] = useState(false);

  const canContinue = age && health;

  const label = (k: MessageKey) => t(k);

  async function onContinue() {
    if (!canContinue) return;
    await grantConsent({
      ageConfirmed18: age,
      consentHealthProcessing: health,
      consentPersonalization: personalization,
      consentResearch: research,
      consentFreeTextToModel: freeText,
      analyticsEnabled: analytics,
    });
    router.replace('/home');
  }

  return (
    <Screen>
      <Txt variant="title">{label('onb.consent.title')}</Txt>

      <Card>
        <Toggle label={label('onb.consent.age')} value={age} onToggle={() => setAge((v) => !v)} />
        <Divider />
        <Toggle label={label('onb.consent.health.label')} value={health} onToggle={() => setHealth((v) => !v)} />
        <Txt variant="muted">{label('onb.consent.health.help')}</Txt>
      </Card>

      <Txt variant="label">{label('onb.consent.optionalTitle')}</Txt>
      <Card>
        <Toggle label={label('onb.consent.personalization')} value={personalization} onToggle={() => setPersonalization((v) => !v)} />
        <Toggle label={label('onb.consent.research')} value={research} onToggle={() => setResearch((v) => !v)} />
        <Toggle label={label('onb.consent.freeText')} value={freeText} onToggle={() => setFreeText((v) => !v)} />
        <Toggle label={label('onb.consent.analytics')} value={analytics} onToggle={() => setAnalytics((v) => !v)} />
      </Card>

      <Txt variant="muted">{label('onb.consent.privacyNote')}</Txt>
      {!canContinue ? <Txt variant="muted">{label('onb.consent.needAge')}</Txt> : null}
      <Spacer size={4} />
      <Button title={label('onb.consent.cta')} onPress={onContinue} disabled={!canContinue} />
    </Screen>
  );
}
