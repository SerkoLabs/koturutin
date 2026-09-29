import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { Button, Card, Screen, Spacer, Txt } from '@/ui/components';
import { useAppState } from '@/state/AppState';
import { EXPERIMENT_LIBRARY_SEED } from '@/data/library-seed';
import { requiresRelationshipGate, type RelationshipContextAnswer } from '@/domain/safety/safety';
import type { ExperimentLibraryEntry } from '@/domain/types';
import type { MessageKey } from '@/i18n';

export default function Select() {
  const router = useRouter();
  const { t, chooseExperiment } = useAppState();
  const [gateFor, setGateFor] = useState<ExperimentLibraryEntry | null>(null);

  // Arriving-home offers the connection + relief options (rule-based; no ML).
  const options = useMemo(
    () =>
      EXPERIMENT_LIBRARY_SEED.filter(
        (e) => e.enabled && (e.functionLabel === 'connection' || e.functionLabel === 'relief_transition'),
      ),
    [],
  );

  // Copy resolved from intent keys (F-012) — no hardcoded literals, no raw-key fallback.
  const labelOf = (e: ExperimentLibraryEntry) => t(`lib.${e.intentKey}.label` as MessageKey);
  const thenOf = (e: ExperimentLibraryEntry) => t(`lib.${e.intentKey}.then` as MessageKey);
  const durationOf = (e: ExperimentLibraryEntry) => t(`dur.${e.durationBand}` as MessageKey);

  async function activate(entry: ExperimentLibraryEntry, relationshipAnswer: RelationshipContextAnswer | null) {
    const r = await chooseExperiment({ entry, thenText: thenOf(entry), relationshipAnswer });
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
      {options.map((entry) => (
        <Card key={entry.id} onPress={() => onPick(entry)}>
          <Txt variant="subtitle">{labelOf(entry)}</Txt>
          <Txt variant="muted">{durationOf(entry)}</Txt>
        </Card>
      ))}
    </Screen>
  );
}
