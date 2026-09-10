/**
 * Reusable, calm design primitives. Kept small and consistent so the product reads as one system,
 * with generous spacing and no gamified noise.
 */
import { ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fontSize, radius, spacing, useTheme } from './theme';

export function Screen({ children, scroll = true }: { children: ReactNode; scroll?: boolean }) {
  const { colors } = useTheme();
  const inner = (
    <View style={{ padding: spacing.xl, gap: spacing.lg, flexGrow: 1 }}>{children}</View>
  );
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top', 'bottom']}>
      {scroll ? (
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          {inner}
        </ScrollView>
      ) : (
        inner
      )}
    </SafeAreaView>
  );
}

type TxtVariant = 'title' | 'subtitle' | 'body' | 'muted' | 'label';

export function Txt({
  children,
  variant = 'body',
  center = false,
}: {
  children: ReactNode;
  variant?: TxtVariant;
  center?: boolean;
}) {
  const { colors } = useTheme();
  const map: Record<TxtVariant, object> = {
    title: { fontSize: fontSize.xl, fontWeight: '700', color: colors.text, lineHeight: fontSize.xl * 1.2 },
    subtitle: { fontSize: fontSize.lg, fontWeight: '600', color: colors.text },
    body: { fontSize: fontSize.md, color: colors.text, lineHeight: fontSize.md * 1.5 },
    muted: { fontSize: fontSize.sm, color: colors.textMuted, lineHeight: fontSize.sm * 1.5 },
    label: { fontSize: fontSize.sm, fontWeight: '600', color: colors.textMuted },
  };
  return <Text style={[map[variant], center && { textAlign: 'center' }]}>{children}</Text>;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  disabled?: boolean;
}) {
  const { colors } = useTheme();
  const bg =
    variant === 'primary' ? colors.accent : variant === 'danger' ? colors.dangerSoft : variant === 'secondary' ? colors.surface : 'transparent';
  const fg = variant === 'primary' ? colors.accentText : variant === 'danger' ? colors.danger : colors.text;
  const border = variant === 'secondary' ? colors.border : 'transparent';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: bg, borderColor: border, borderWidth: variant === 'secondary' ? 1 : 0, opacity: disabled ? 0.5 : pressed ? 0.85 : 1 },
      ]}
    >
      <Text style={{ color: fg, fontSize: fontSize.md, fontWeight: '600' }}>{title}</Text>
    </Pressable>
  );
}

export function Card({ children, onPress, selected = false }: { children: ReactNode; onPress?: () => void; selected?: boolean }) {
  const { colors } = useTheme();
  const content = (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: selected ? colors.accent : colors.border, borderWidth: selected ? 2 : 1 },
      ]}
    >
      {children}
    </View>
  );
  if (!onPress) return content;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })} accessibilityRole="button">
      {content}
    </Pressable>
  );
}

export function Field({ label, ...props }: { label: string } & TextInputProps) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: spacing.sm }}>
      <Txt variant="label">{label}</Txt>
      <TextInput
        placeholderTextColor={colors.textMuted}
        style={{
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surface,
          borderRadius: radius.md,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
          color: colors.text,
          fontSize: fontSize.md,
        }}
        {...props}
      />
    </View>
  );
}

/** A calm 0–10 scale, tappable, no gamification. */
export function Scale({ label, value, onChange }: { label: string; value: number | null; onChange: (v: number) => void }) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: spacing.sm }}>
      <Txt variant="label">{label}</Txt>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {Array.from({ length: 11 }, (_, i) => i).map((n) => {
          const active = value === n;
          return (
            <Pressable
              key={n}
              onPress={() => onChange(n)}
              accessibilityRole="button"
              accessibilityLabel={`${label} ${n}`}
              style={{
                width: 44,
                height: 44,
                borderRadius: radius.pill,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: active ? 2 : 1,
                borderColor: active ? colors.accent : colors.border,
                backgroundColor: active ? colors.accent : colors.surfaceAlt,
              }}
            >
              <Text style={{ color: active ? colors.accentText : colors.textMuted, fontWeight: '600' }}>{n}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/** A calm checkbox-style toggle row (used for consents/settings). */
export function Toggle({ label, value, onToggle }: { label: string; value: boolean; onToggle: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={label}
      style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm, minHeight: 44 }}
    >
      <View
        style={{
          width: 26,
          height: 26,
          borderRadius: radius.sm,
          borderWidth: 2,
          borderColor: value ? colors.accent : colors.border,
          backgroundColor: value ? colors.accent : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {value ? <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: colors.accentText }} /> : null}
      </View>
      <View style={{ flex: 1 }}>
        <Txt variant="body">{label}</Txt>
      </View>
    </Pressable>
  );
}

export function Divider() {
  const { colors } = useTheme();
  return <View style={{ height: 1, backgroundColor: colors.border, marginVertical: spacing.sm }} />;
}

export function Spacer({ size = spacing.md }: { size?: number }) {
  return <View style={{ height: size }} />;
}

const styles = StyleSheet.create({
  btn: {
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
});
