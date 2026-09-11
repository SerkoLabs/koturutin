/**
 * Notification settings (F-013, S-09). Lets the user control the rule-based decision engine's two
 * inputs (spine §7): the daily proactive-notification budget (0–2; "0" = no proactive nudges at all)
 * and one same-day quiet interval during which proactive notifications are withheld. Local-first:
 * changes persist to the on-device profile via AppState; no backend required.
 */
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Card, Divider, Screen, Spacer, Toggle, Txt } from '@/ui/components';
import { radius, spacing, useTheme } from '@/ui/theme';
import { useAppState } from '@/state/AppState';

const BUDGETS = [0, 1, 2] as const;
const clampHour = (h: number): number => Math.max(0, Math.min(23, h));

function StepButton({ text, onPress, label }: { text: string; onPress: () => void; label: string }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => ({
        width: 44,
        height: 44,
        borderRadius: radius.pill,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surfaceAlt,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <Text style={{ color: colors.text, fontSize: 22, fontWeight: '600' }}>{text}</Text>
    </Pressable>
  );
}

export default function NotificationSettings() {
  const router = useRouter();
  const { t, data, setNotificationBudget, setQuietWindows } = useAppState();
  const p = data.profile;
  const existing = p?.quietWindows?.[0] ?? null;

  const [enabled, setEnabled] = useState<boolean>(!!existing);
  const [startH, setStartH] = useState<number>(existing ? Math.floor(existing.startMinute / 60) : 12);
  const [endH, setEndH] = useState<number>(existing ? Math.floor(existing.endMinute / 60) : 14);

  const invalid = enabled && startH >= endH;

  function apply(nextEnabled: boolean, sH: number, eH: number) {
    setEnabled(nextEnabled);
    setStartH(sH);
    setEndH(eH);
    // Persist only an engine-safe (same-day, start < end) window; otherwise clear it.
    if (nextEnabled && sH < eH) {
      void setQuietWindows([{ startMinute: sH * 60, endMinute: eH * 60, days: [] }]);
    } else {
      void setQuietWindows([]);
    }
  }

  const budget = p?.notificationBudget ?? 2;

  return (
    <Screen>
      <Txt variant="title">{t('notif.title')}</Txt>
      <Txt variant="muted">{t('notif.body')}</Txt>

      {/* Daily proactive budget */}
      <Card>
        <Txt variant="label">{t('notif.budget.label')}</Txt>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          {BUDGETS.map((n) => (
            <View key={n} style={{ flex: 1 }}>
              <Button
                title={t(`notif.budget.${n}` as 'notif.budget.0' | 'notif.budget.1' | 'notif.budget.2')}
                onPress={() => void setNotificationBudget(n)}
                variant={budget === n ? 'primary' : 'secondary'}
              />
            </View>
          ))}
        </View>
        <Txt variant="muted">{t('notif.budget.help')}</Txt>
      </Card>

      {/* Quiet interval */}
      <Card>
        <Txt variant="label">{t('notif.quiet.label')}</Txt>
        <Toggle label={t('notif.quiet.enable')} value={enabled} onToggle={() => apply(!enabled, startH, endH)} />
        {enabled ? (
          <>
            <Divider />
            <View style={{ gap: spacing.sm }}>
              <Txt variant="label">{t('notif.quiet.start')}</Txt>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                <StepButton text="−" label={`${t('notif.quiet.start')} −1`} onPress={() => apply(enabled, clampHour(startH - 1), endH)} />
                <Txt variant="subtitle">{String(startH).padStart(2, '0')}:00</Txt>
                <StepButton text="+" label={`${t('notif.quiet.start')} +1`} onPress={() => apply(enabled, clampHour(startH + 1), endH)} />
              </View>
            </View>
            <View style={{ gap: spacing.sm }}>
              <Txt variant="label">{t('notif.quiet.end')}</Txt>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                <StepButton text="−" label={`${t('notif.quiet.end')} −1`} onPress={() => apply(enabled, startH, clampHour(endH - 1))} />
                <Txt variant="subtitle">{String(endH).padStart(2, '0')}:00</Txt>
                <StepButton text="+" label={`${t('notif.quiet.end')} +1`} onPress={() => apply(enabled, startH, clampHour(endH + 1))} />
              </View>
            </View>
            {invalid ? <Txt variant="muted">{t('notif.quiet.invalid')}</Txt> : null}
          </>
        ) : null}
        <Txt variant="muted">{t('notif.quiet.help')}</Txt>
      </Card>

      <Spacer size={spacing.sm} />
      <Button title={t('settings.back')} onPress={() => router.back()} variant="ghost" />
    </Screen>
  );
}
