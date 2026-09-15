import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Button, Card, Field, Scale, Screen, Spacer, Txt } from '@/ui/components';
import { useAppState } from '@/state/AppState';
import { scanForRiskPhrases } from '@/domain/safety/safety';

export default function Observe() {
  const router = useRouter();
  const { t, addObservationCheckin } = useAppState();
  const [context, setContext] = useState('');
  const [behavior, setBehavior] = useState('');
  const [craving, setCraving] = useState<number | null>(null);
  const [energy, setEnergy] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);

  async function onSave() {
    // Rule-based safety net before persisting any free text (spine §10).
    if (scanForRiskPhrases(`${context} ${behavior}`).risk) {
      router.replace('/safety');
      return;
    }
    const r = await addObservationCheckin({
      context: context.trim() || null,
      behavior: behavior.trim() || null,
      craving,
      energy,
    });
    if (r.ok) setSaved(true);
  }

  if (saved) {
    return (
      <Screen>
        <Spacer size={24} />
        <Txt variant="title">{t('observe.saved')}</Txt>
        <Spacer size={8} />
        <Button title={t('home.title')} onPress={() => router.replace('/home')} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Txt variant="title">{t('observe.title')}</Txt>
      <Txt variant="muted">{t('observe.body')}</Txt>
      <Field label={t('observe.context.label')} placeholder={t('observe.context.placeholder')} value={context} onChangeText={setContext} />
      <Field label={t('observe.behavior.label')} placeholder={t('observe.behavior.placeholder')} value={behavior} onChangeText={setBehavior} />
      <Card>
        <Scale label={t('observe.craving')} value={craving} onChange={setCraving} />
        <Scale label={t('observe.energy')} value={energy} onChange={setEnergy} />
      </Card>
      <Spacer size={4} />
      <Button title={t('observe.save')} onPress={onSave} />
    </Screen>
  );
}
