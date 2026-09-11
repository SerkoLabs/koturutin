/**
 * Notification settings (F-013, S-09). Lets the user control the rule-based decision engine's two
 * inputs (spine §7): the daily proactive-notification budget (0–2; "0" = no proactive nudges at all)
 * and one same-day quiet interval during which proactive notifications are withheld. Local-first:
 * changes persist to the on-device profile via AppState; no backend required.
 *
 * Stateless by design: every control is derived directly from the persisted profile and each change
 * persists immediately. There is no local component state to drift, so the UI can never desync from
 * what is stored, and the quiet interval always keeps a start < end invariant (steppers auto-adjust).
 * Tightening a preference (budget → 0, or setting a quiet interval) cancels any already-scheduled
 * reminder — handled in AppState.
 */
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Card, Divider, Screen, Spacer, Toggle, Txt } from '@/ui/components';
import { radius, spacing, useTheme } from '@/ui/theme';
import { useAppState } from '@/state/AppState';
import type { QuietWindow } from '@/domain/types';

const BUDGETS = [0, 1, 2] as const;
const DEFAULT_START_H = 12;
const DEFAULT_END_H = 14;
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

  const budget = p?.notificationBudget ?? 2;
  const win = p?.quietWindows?.[0] ?? null;
  const enabled = win !== null;
  const startH = win ? Math.floor(win.startMinute / 60) : DEFAULT_START_H;
  const endH = win ? Math.floor(win.endMinute / 60) : DEFAULT_END_H;

  const save = (sH: number, eH: number) => {
    const w: QuietWindow = { startMinute: sH * 60, endMinute: eH * 60, days: [] };
    void setQuietWindows([w]);
  };

  const onToggle = () => {
    if (enabled) void setQuietWindows([]);
    else save(DEFAULT_START_H, DEFAULT_END_H);
  };

  // Steppers keep start < end at all times (auto-adjust), so no invalid interval can be stored.
  const changeStart = (delta: number) => {
    let sH = clampHour(startH + delta);
    let eH = endH;
    if (sH >= eH) eH = Math.min(23, sH + 1);
    if (sH >= eH) sH = eH - 1;
    save(sH, eH);
  };
  const changeEnd = (delta: number) => {
    let eH = clampHour(endH + delta);
    let sH = startH;
    if (eH <= sH) sH = Math.max(0, eH - 1);
    if (eH <= sH) eH = sH + 1;
    save(sH, eH);
  };

  return (
    <Screen>
      <Txt variant="title">{t('notif.title')}</Txt>
      <Txt variant="muted">{t('notif.body')}</Txt>

      {/* Daily proactive budget */}
      <Card>
        <Txt variant="label">{t('notif.budget.label')}</Txt>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          {BUDGETS.map((nn) => (
            <View key={nn} style={{ flex: 1 }}>
              <Button
                title={t(`notif.budget.${nn}` as 'notif.budget.0' | 'notif.budget.1' | 'notif.budget.2')}
                onPress={() => void setNotificationBudget(nn)}
                variant={budget === nn ? 'primary' : 'secondary'}
                selected={budget === nn}
              />
            </View>
          ))}
        </View>
        <Txt variant="muted">{t('notif.budget.help')}</Txt>
      </Card>

      {/* Quiet interval */}
      <Card>
        <Txt variant="label">{t('notif.quiet.label')}</Txt>
        <Toggle label={t('notif.quiet.enable')} value={enabled} onToggle={onToggle} />
        {enabled ? (
          <>
            <Divider />
            <View style={{ gap: spacing.sm }}>
              <Txt variant="label">{t('notif.quiet.start')}</Txt>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                <StepButton text="−" label={`${t('notif.quiet.start')} −1`} onPress={() => changeStart(-1)} />
                <Txt variant="subtitle">{String(startH).padStart(2, '0')}:00</Txt>
                <StepButton text="+" label={`${t('notif.quiet.start')} +1`} onPress={() => changeStart(1)} />
              </View>
            </View>
            <View style={{ gap: spacing.sm }}>
              <Txt variant="label">{t('notif.quiet.end')}</Txt>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                <StepButton text="−" label={`${t('notif.quiet.end')} −1`} onPress={() => changeEnd(-1)} />
                <Txt variant="subtitle">{String(endH).padStart(2, '0')}:00</Txt>
                <StepButton text="+" label={`${t('notif.quiet.end')} +1`} onPress={() => changeEnd(1)} />
              </View>
            </View>
          </>
        ) : null}
        <Txt variant="muted">{t('notif.quiet.help')}</Txt>
      </Card>

      <Spacer size={spacing.sm} />
      <Button title={t('settings.back')} onPress={() => router.back()} variant="ghost" />
    </Screen>
  );
}
