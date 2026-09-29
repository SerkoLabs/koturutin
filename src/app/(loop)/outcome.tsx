import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button, Card, Field, Scale, Screen, Spacer, Txt } from '@/ui/components';
import { useAppState } from '@/state/AppState';
import { scanForRiskPhrases } from '@/domain/safety/safety';

export default function OutcomeScreen() {
  const router = useRouter();
  const { attemptId } = useLocalSearchParams<{ attemptId: string }>();
  const { t, saveOutcome } = useAppState();

  const [craving, setCraving] = useState<number | null>(null);
  const [energy, setEnergy] = useState<number | null>(null);
  const [mood, setMood] = useState<number | null>(null);
  const [connection, setConnection] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(false);

  async function onSave() {
    if (!attemptId) return;
    // Safety: a risk phrase in the note diverts to the crisis flow BEFORE saving coaching state
    // (UF-007). The decision is rule-based, never an LLM.
    if (scanForRiskPhrases(note).risk) {
      router.replace('/safety');
      return;
    }
    await saveOutcome(attemptId, {
      craving,
      energy,
      mood,
      connectionFeeling: connection,
      freeNote: note.trim().length > 0 ? note.trim() : null,
    });
    setSaved(true);
  }

  if (saved) {
    return (
      <Screen>
        <Spacer size={24} />
        <Txt variant="title">{t('outcome.saved')}</Txt>
        <Spacer size={8} />
        <Button title={t('home.title')} onPress={() => router.replace('/home')} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Txt variant="title">{t('outcome.title')}</Txt>
      <Txt variant="muted">{t('outcome.body')}</Txt>
      <Card>
        <Scale label={t('outcome.craving')} value={craving} onChange={setCraving} />
        <Scale label={t('outcome.energy')} value={energy} onChange={setEnergy} />
        <Scale label={t('outcome.mood')} value={mood} onChange={setMood} />
        <Scale label={t('outcome.connection')} value={connection} onChange={setConnection} />
      </Card>
      <Field
        label={`${t('outcome.note.label')} · ${t('common.localOnly')}`}
        placeholder={t('outcome.note.placeholder')}
        value={note}
        onChangeText={setNote}
        multiline
      />
      <Spacer size={4} />
      <Button title={t('outcome.save')} onPress={onSave} />
    </Screen>
  );
}
