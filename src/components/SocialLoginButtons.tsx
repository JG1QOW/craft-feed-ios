import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../auth/AuthContext';
import { SocialSignInCancelled, isAppleAvailable, isGoogleConfigured, signInWithApple, signInWithGoogle } from '../auth/social';
import { useI18n } from '../i18n';
import { colors, radii, spacing } from '../theme';
import { errorMessage } from '../utils/errors';

export function SocialLoginButtons({ onError }: { onError: (message: string | null) => void }) {
  const { t } = useI18n();
  const { loginWithSocial } = useAuth();
  const [appleAvailable, setAppleAvailable] = useState(false);
  const [busy, setBusy] = useState<'google' | 'apple' | null>(null);
  const google = isGoogleConfigured();

  useEffect(() => {
    void isAppleAvailable().then(setAppleAvailable);
  }, []);

  if (!google && !appleAvailable) return null;

  const run = async (provider: 'google' | 'apple') => {
    onError(null);
    setBusy(provider);
    try {
      const identity = provider === 'google' ? await signInWithGoogle() : await signInWithApple();
      await loginWithSocial(identity);
    } catch (e) {
      if (!(e instanceof SocialSignInCancelled)) onError(errorMessage(e, t.auth.socialFailed));
    } finally {
      setBusy(null);
    }
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.divider}>
        <View style={styles.line} />
        <Text style={styles.or}>{t.auth.or}</Text>
        <View style={styles.line} />
      </View>
      {google && (
        <Pressable
          accessibilityRole="button"
          disabled={busy !== null}
          onPress={() => run('google')}
          style={({ pressed }) => [styles.button, styles.google, { opacity: pressed || busy ? 0.7 : 1 }]}
          testID="login-google"
        >
          {busy === 'google' ? (
            <ActivityIndicator color={colors.text} />
          ) : (
            <>
              <Ionicons name="logo-google" size={18} color="#4285F4" />
              <Text style={[styles.label, { color: colors.text }]}>{t.auth.continueWithGoogle}</Text>
            </>
          )}
        </Pressable>
      )}
      {appleAvailable && (
        <Pressable
          accessibilityRole="button"
          disabled={busy !== null}
          onPress={() => run('apple')}
          style={({ pressed }) => [styles.button, styles.apple, { opacity: pressed || busy ? 0.7 : 1 }]}
          testID="login-apple"
        >
          {busy === 'apple' ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="logo-apple" size={20} color="#fff" />
              <Text style={[styles.label, { color: '#fff' }]}>{t.auth.continueWithApple}</Text>
            </>
          )}
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm + 2, marginTop: spacing.xs },
  divider: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginVertical: spacing.xs },
  line: { flex: 1, height: 1, backgroundColor: colors.border },
  or: { color: colors.textMuted, fontSize: 13 },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 48,
    borderRadius: radii.md,
    borderWidth: 2,
  },
  google: { backgroundColor: '#fff', borderColor: colors.border },
  apple: { backgroundColor: '#000', borderColor: '#000' },
  label: { fontSize: 16, fontWeight: '600' },
});
