import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { auth } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { Button, ErrorText, Input } from '../components/ui';
import { useI18n } from '../i18n';
import type { AuthStackParamList } from '../navigation/types';
import { colors, spacing } from '../theme';
import { errorMessage } from '../utils/errors';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const { t } = useI18n();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError(null);
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (e) {
      setError(errorMessage(e, t.auth.loginFailed));
    } finally {
      setLoading(false);
    }
  };

  const forgot = async () => {
    if (!email.trim()) {
      setError(t.auth.email);
      return;
    }
    try {
      await auth.forgotPassword(email.trim());
    } catch {
      // Endpoint always responds generically; ignore failures to avoid enumeration.
    }
    Alert.alert(t.common.appName, t.auth.forgotPasswordSent);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <Text style={styles.brand}>{t.common.appName}</Text>
      </View>
      <View style={styles.form}>
        <Input
          placeholder={t.auth.email}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          textContentType="emailAddress"
          autoComplete="email"
          testID="login-email"
        />
        <Input
          placeholder={t.auth.password}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          textContentType="password"
          autoComplete="password"
          onSubmitEditing={submit}
          testID="login-password"
        />
        <ErrorText message={error} />
        <Button title={t.auth.login} onPress={submit} loading={loading} testID="login-submit" />
        <Pressable onPress={forgot} style={styles.link}>
          <Text style={styles.linkText}>{t.auth.forgotPassword}</Text>
        </Pressable>
        <View style={styles.footer}>
          <Text style={styles.muted}>{t.auth.noAccount}</Text>
          <Pressable onPress={() => navigation.navigate('Register')}>
            <Text style={styles.linkText}> {t.auth.register}</Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingTop: 96,
    paddingBottom: spacing.lg,
    alignItems: 'center',
    backgroundColor: colors.primary,
  },
  brand: { color: '#fff', fontSize: 32, fontWeight: '700' },
  form: { padding: spacing.lg, gap: spacing.md },
  link: { alignItems: 'center', paddingVertical: spacing.sm },
  linkText: { color: colors.primaryDark, fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.md },
  muted: { color: colors.textMuted },
});
