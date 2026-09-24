import React from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type PressableProps,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, LOGO_URL, radii, shadow, spacing } from '../theme';

type Variant = 'primary' | 'secondary' | 'danger' | 'slate';

export function Button({
  title,
  loading,
  variant = 'primary',
  disabled,
  compact,
  style,
  ...props
}: Omit<PressableProps, 'style'> & {
  title: string;
  loading?: boolean;
  variant?: Variant;
  compact?: boolean;
  style?: ViewStyle;
}) {
  const fg = variant === 'secondary' ? colors.primaryDark : '#fff';
  const solid =
    variant === 'danger' ? colors.danger : variant === 'slate' ? colors.slate : variant === 'secondary' ? '#fff' : undefined;
  const content = loading ? (
    <ActivityIndicator color={fg} />
  ) : (
    <Text style={[styles.buttonText, compact && styles.buttonTextCompact, { color: fg }]}>{title}</Text>
  );
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        compact && styles.buttonCompact,
        solid !== undefined && { backgroundColor: solid },
        variant === 'secondary' && styles.buttonSecondary,
        variant === 'slate' && styles.buttonSlate,
        { opacity: pressed || disabled || loading ? 0.7 : 1 },
        style,
      ]}
      {...props}
    >
      {variant === 'primary' && (
        <LinearGradient
          colors={gradients.primaryButton}
          start={gradients.headerStart}
          end={gradients.headerEnd}
          style={StyleSheet.absoluteFill}
        />
      )}
      {content}
    </Pressable>
  );
}

export function Input(props: TextInputProps) {
  return (
    <TextInput
      placeholderTextColor={colors.textMuted}
      style={[styles.input, props.style]}
      autoCapitalize="none"
      autoCorrect={false}
      {...props}
    />
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Label({ children }: { children: React.ReactNode }) {
  return <Text style={styles.label}>{children}</Text>;
}

export function PageTitle({ children }: { children: React.ReactNode }) {
  return <Text style={styles.pageTitle}>{children}</Text>;
}

export function CountPill({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.countPill}>
      <Text style={styles.countPillText}>{children}</Text>
    </View>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <View style={styles.segmented}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={styles.segment}
          >
            {active && (
              <LinearGradient
                colors={gradients.primaryButton}
                start={gradients.headerStart}
                end={gradients.headerEnd}
                style={[StyleSheet.absoluteFill, { borderRadius: radii.sm }]}
              />
            )}
            <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function HeaderBackground() {
  return (
    <LinearGradient
      colors={gradients.header}
      start={gradients.headerStart}
      end={gradients.headerEnd}
      style={StyleSheet.absoluteFill}
    />
  );
}

export function HeaderTitle({ title }: { title: string }) {
  return (
    <View style={styles.headerTitle}>
      <Image source={{ uri: LOGO_URL }} style={styles.headerLogo} />
      <Text style={styles.headerTitleText} numberOfLines={1}>
        {title}
      </Text>
    </View>
  );
}

export function ErrorText({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <View style={styles.errorBox}>
      <Text style={styles.error}>{message}</Text>
    </View>
  );
}

export function Centered({ children }: { children: React.ReactNode }) {
  return <View style={styles.centered}>{children}</View>;
}

export function Loading() {
  return (
    <Centered>
      <ActivityIndicator size="large" color={colors.primary} />
    </Centered>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    overflow: 'hidden',
  },
  buttonCompact: { minHeight: 36, paddingVertical: 8, paddingHorizontal: 12, borderRadius: radii.sm },
  buttonSecondary: {
    borderWidth: 1,
    borderColor: colors.primary,
  },
  buttonSlate: { borderWidth: 1, borderColor: colors.slateDark },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextCompact: { fontSize: 13 },
  input: {
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  label: { fontSize: 14, fontWeight: '600', color: colors.text },
  pageTitle: { fontSize: 26, fontWeight: '700', color: colors.primaryDarker },
  countPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radii.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: 'rgba(25, 165, 170, 0.25)',
  },
  countPillText: { color: '#0f766e', fontWeight: '600', fontSize: 13 },
  segmented: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.md,
    padding: 4,
    gap: 4,
  },
  segment: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.sm,
    overflow: 'hidden',
  },
  segmentText: { fontSize: 13, fontWeight: '500', color: colors.textMuted },
  segmentTextActive: { color: '#fff' },
  headerTitle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerLogo: { width: 28, height: 28, borderRadius: 6 },
  headerTitleText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  errorBox: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: radii.md,
    padding: 10,
  },
  error: {
    color: '#991b1b',
    fontSize: 14,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
});
