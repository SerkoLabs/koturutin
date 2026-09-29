/**
 * Day map / full-day narration (F-002). Renders the deterministic projection of the user's day
 * (buildDayMap) as a calm, chronological chain of segments, with a local, non-judgmental narration
 * on top. Tapping a segment reveals its routine detail inline (trigger → behavior → deferred cost)
 * — no new route, no architecture change. Local-first: everything is derived from on-device data.
 */
import { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Card, Divider, Screen, Spacer, Txt } from '@/ui/components';
import { spacing } from '@/ui/theme';
import { useAppState } from '@/state/AppState';
import { narrateDay, type DayPart, type NarrationCopy } from '@/domain/daymap/daymap';

export default function DayMapScreen() {
  const router = useRouter();
  const { t, dayMap } = useAppState();
  const [openId, setOpenId] = useState<string | null>(null);

  const copy: NarrationCopy = {
    opening: t('daymap.narration.opening'),
    closing: t('daymap.narration.closing'),
    spaceNote: t('daymap.narration.spaceNote'),
    connector: t('daymap.connector'),
    dayPart: {
      morning: t('daypart.morning'),
      commute: t('daypart.commute'),
      daytime: t('daypart.daytime'),
      evening_return: t('daypart.evening_return'),
      evening: t('daypart.evening'),
      night: t('daypart.night'),
    } as Record<DayPart, string>,
  };

  const narration = narrateDay(dayMap, copy);

  return (
    <Screen>
      <Txt variant="title">{t('daymap.title')}</Txt>
      <Txt variant="muted">{t('daymap.body')}</Txt>

      {dayMap.isEmpty ? (
        <Card>
          <Txt variant="body">{t('daymap.empty')}</Txt>
          <Spacer size={4} />
          <Button title={t('daymap.empty.cta')} onPress={() => router.push('/capture')} variant="secondary" />
        </Card>
      ) : (
        <>
          {/* Calm, local narration of the whole chain */}
          <Card>
            {narration.map((line, i) => (
              <Txt key={i} variant={i === 0 ? 'body' : 'muted'}>
                {line}
              </Txt>
            ))}
          </Card>

          {/* Chronological segments; tap to reveal the routine detail inline */}
          {dayMap.segments.map((seg) => {
            const open = openId === seg.moment.id;
            const behaviors = seg.edges.map((e) => e.behavior).filter((bhv) => bhv.length > 0);
            const chain = behaviors.length > 0 ? behaviors.join('  →  ') : seg.moment.name;
            return (
              <Card key={seg.moment.id} onPress={() => setOpenId(open ? null : seg.moment.id)} selected={open} expanded={open}>
                <Txt variant="label">{copy.dayPart[seg.dayPart]}</Txt>
                <Txt variant="subtitle">{seg.moment.name}</Txt>
                <Txt variant="body">{chain}</Txt>
                {open ? (
                  <>
                    <Divider />
                    {seg.edges.map((e) => (
                      <View key={e.id} style={{ gap: 2, marginBottom: spacing.sm }}>
                        <Txt variant="muted">{`${t('daymap.trigger')}: ${e.trigger}`}</Txt>
                        <Txt variant="body">{e.behavior}</Txt>
                        {e.delayedCost ? <Txt variant="muted">{`${t('daymap.delayedCost')}: ${e.delayedCost}`}</Txt> : null}
                      </View>
                    ))}
                    {seg.observations.length > 0 ? (
                      <Txt variant="muted">{`${t('daymap.observations')}: ${seg.observations.length}`}</Txt>
                    ) : null}
                  </>
                ) : (
                  <Txt variant="muted">{t('daymap.detail')}</Txt>
                )}
              </Card>
            );
          })}
        </>
      )}

      <Spacer size={spacing.sm} />
      <Button title={t('common.back')} onPress={() => router.replace('/home')} variant="secondary" />
    </Screen>
  );
}
