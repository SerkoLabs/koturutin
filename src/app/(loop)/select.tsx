import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { Button, Card, Screen, Spacer, Txt } from '@/ui/components';
import { useAppState } from '@/state/AppState';
import { EXPERIMENT_LIBRARY_SEED } from '@/data/library-seed';
import { requiresRelationshipGate, type RelationshipContextAnswer } from '@/domain/safety/safety';
import type { ExperimentLibraryEntry } from '@/domain/types';

// Minimal per-entry copy for the arriving-home slice (resolved from intent keys in a fuller build).
const ENTRY_COPY: Record<string, { tr: string; en: string; then: { tr: string; en: string } }> = {
  'transition.home.arrival.connection': {
    tr: '90 saniyelik aile teması, sonra bilinçli seçim',
    en: '90 seconds of family contact, then a conscious choice',
    then: { tr: 'Önce 90 saniye eşine/çocuğuna yönel', en: 'First, turn to your partner/child for 90 seconds' },
  },
  'transition.home.arrival.relief': {
    tr: 'Kapıda 60 saniye nefes / kıyafet değiştir',
    en: '60 seconds of breathing / change clothes at the door',
    then: { tr: '60 saniye yavaş nefes al', en: 'Take 60 seconds of slow breathing' },
  },
};

export default function Select() {
  const router = useRouter();
  const { t, language, chooseExperiment } = useAppState();
  const [gateFor, setGateFor] = useState<ExperimentLibraryEntry | null>(null);

  // Arriving-home offers the connection + relief options (rule-based; no ML).
  const options = useMemo(
    () => EXPERIMENT_LIBRARY_SEED.filter((e) => e.enabled && (e.functionLabel === 'connection' || e.functionLabel === 'relief_transition')),
    [],
  );

  async function activate(entry: ExperimentLibraryEntry, relationshipAnswer: RelationshipContextAnswer | null) {
    const copy = ENTRY_COPY[entry.intentKey];
    const r = await chooseExperiment({
      entry,
      ifThisThenThat: {
        if: t('select.plan.if'),
        then: copy ? copy.then[language] : entry.intentKey,
      },
      relationshipAnswer,
    });
    if (r.ok) {
      router.replace('/home');
    } else if (r.reason === 'relationship_unsafe') {
      router.replace('/safety');
    }
  }

  function onPick(entry: ExperimentLibraryEntry) {
    if (requiresRelationshipGate(entry.safetyClass)) {
      setGateFor(entry); // show the safety gate before activating
    } else {
      void activate(entry, null);
    }
  }

  if (gateFor) {
    return (
      <Screen>
        <Txt variant="title">{t('select.gate.title')}</Txt>
        <Txt variant="body">{t('select.gate.body')}</Txt>
        <Spacer size={8} />
        <Button title={t('select.gate.safe')} onPress={() => activate(gateFor, 'safe')} />
        <Button title={t('select.gate.unsure')} onPress={() => activate(gateFor, 'unsure')} variant="secondary" />
        <Button title={t('select.gate.unsafe')} onPress={() => activate(gateFor, 'unsafe')} variant="danger" />
      </Screen>
    );
  }

  return (
    <Screen>
      <Txt variant="title">{t('select.title')}</Txt>
      <Txt variant="muted">{t('select.body')}</Txt>
      <Spacer size={4} />
      {options.map((entry) => {
        const copy = ENTRY_COPY[entry.intentKey];
        return (
          <Card key={entry.id} onPress={() => onPick(entry)}>
            <Txt variant="subtitle">{copy ? copy[language] : entry.intentKey}</Txt>
            <Txt variant="muted">{`${entry.durationBand}`}</Txt>
          </Card>
        );
      })}
    </Screen>
  );
}
