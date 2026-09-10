import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Button, Card, Scale, Screen, Spacer, Txt } from '@/ui/components';
import { useAppState } from '@/state/AppState';
import { format } from '@/i18n';
import type { MessageKey } from '@/i18n';

const ITEMS: MessageKey[] = ['who5.q1', 'who5.q2', 'who5.q3', 'who5.q4', 'who5.q5'];

export default function Who5() {
  const router = useRouter();
  const { t, language, submitWho5, latestWho5Score } = useAppState();
  const [optedIn, setOptedIn] = useState(false);
  const [answers, setAnswers] = useState<(number | null)[]>([null, null, null, null, null]);
  const [savedScore, setSavedScore] = useState<number | null>(null);

  const allAnswered = answers.every((a) => a !== null);

  function setAnswer(i: number, v: number) {
    setAnswers((prev) => prev.map((a, idx) => (idx === i ? v : a)));
  }

  async function onSave() {
    if (!allAnswered) return;
    const r = await submitWho5(answers as number[]);
    if (r.ok) {
      const total = (answers as number[]).reduce((a, b) => a + b, 0) * 4;
      setSavedScore(total);
    }
  }

  if (savedScore !== null) {
    return (
      <Screen>
        <Spacer size={24} />
        <Txt variant="title">{format(language, 'who5.result', { score: savedScore })}</Txt>
        <Txt variant="muted">{t('who5.resultNote')}</Txt>
        <Spacer size={8} />
        <Button title={t('settings.back')} onPress={() => router.back()} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Txt variant="title">{t('who5.title')}</Txt>
      <Txt variant="muted">{t('who5.intro')}</Txt>
      {latestWho5Score !== null ? (
        <Txt variant="muted">{`${t('who5.last')}: ${latestWho5Score}/100`}</Txt>
      ) : null}

      {!optedIn ? (
        <>
          <Spacer size={8} />
          <Button title={t('who5.optin')} onPress={() => setOptedIn(true)} />
          <Button title={t('settings.back')} onPress={() => router.back()} variant="ghost" />
        </>
      ) : (
        <>
          <Txt variant="muted">{t('who5.scaleHint')}</Txt>
          <Card>
            {ITEMS.map((key, i) => (
              <Scale key={key} label={t(key)} value={answers[i]} max={5} onChange={(v) => setAnswer(i, v)} />
            ))}
          </Card>
          {!allAnswered ? <Txt variant="muted">{t('who5.needAll')}</Txt> : null}
          <Button title={t('who5.save')} onPress={onSave} disabled={!allAnswered} />
        </>
      )}
    </Screen>
  );
}
