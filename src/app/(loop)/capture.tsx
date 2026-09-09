import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Card, Field, Screen, Spacer, Txt } from '@/ui/components';
import { radius, spacing, useTheme } from '@/ui/theme';
import { useAppState } from '@/state/AppState';

const HOUR_CHOICES = [7, 8, 12, 17, 18, 19, 20, 22];

export default function Capture() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t, addArrivingHomeMoment } = useAppState();
  const [name, setName] = useState('');
  const [trigger, setTrigger] = useState('');
  const [behavior, setBehavior] = useState('');
  const [hour, setHour] = useState<number | null>(18);
  const [saving, setSaving] = useState(false);

  const canConfirm = name.trim().length > 0 && trigger.trim().length > 0 && behavior.trim().length > 0;

  async function onConfirm() {
    if (!canConfirm || saving) return;
    setSaving(true);
    const r = await addArrivingHomeMoment({
      name: name.trim(),
      trigger: trigger.trim(),
      behavior: behavior.trim(),
      context: null,
      timeWindowStartMinute: hour !== null ? hour * 60 : null,
      timeWindowEndMinute: hour !== null ? (hour + 1) * 60 : null,
    });
    setSaving(false);
    if (r.ok) router.replace('/home');
  }

  return (
    <Screen>
      <Txt variant="title">{t('capture.title')}</Txt>
      <Txt variant="muted">{t('capture.body')}</Txt>

      <Field label={t('capture.name.label')} placeholder={t('capture.name.placeholder')} value={name} onChangeText={setName} />
      <Field label={t('capture.trigger.label')} placeholder={t('capture.trigger.placeholder')} value={trigger} onChangeText={setTrigger} />
      <Field label={t('capture.behavior.label')} placeholder={t('capture.behavior.placeholder')} value={behavior} onChangeText={setBehavior} />

      <View style={{ gap: spacing.sm }}>
        <Txt variant="label">{t('capture.window.label')}</Txt>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {HOUR_CHOICES.map((h) => {
            const active = hour === h;
            return (
              <Pressable
                key={h}
                onPress={() => setHour(h)}
                accessibilityRole="button"
                style={{
                  paddingVertical: spacing.sm,
                  paddingHorizontal: spacing.lg,
                  borderRadius: radius.pill,
                  backgroundColor: active ? colors.accent : colors.surfaceAlt,
                }}
              >
                <Txt variant="body">{`${String(h).padStart(2, '0')}:00`}</Txt>
              </Pressable>
            );
          })}
        </View>
        <Txt variant="muted">{t('capture.window.help')}</Txt>
      </View>

      <Card>
        <Txt variant="label">{t('capture.confirm.question')}</Txt>
        <Txt variant="body">{trigger.trim() || t('capture.trigger.placeholder')} → {behavior.trim() || t('capture.behavior.placeholder')}</Txt>
      </Card>

      <Spacer size={4} />
      <Button title={t('capture.confirm.cta')} onPress={onConfirm} disabled={!canConfirm} />
    </Screen>
  );
}
