import React, { useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { auth } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { Button, Card, ErrorText, Input, Label } from '../components/ui';
import { useI18n } from '../i18n';
import type { AuthStackParamList } from '../navigation/types';
import { colors, gradients, LOGO_URL, radii, spacing } from '../theme';
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
      <LinearGradient colors={gradients.header} start={gradients.headerStart} end={gradients.headerEnd} style={styles.header}>
        <Image source={{ uri: LOGO_URL }} style={styles.logo} />
        <Text style={styles.brand}>{t.common.appName}</Text>
      </LinearGradient>
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
      <Card>
        <View style={styles.cardHeader}>
          <Text style={styles.cardHeaderText}>{t.auth.login}</Text>
        </View>
        <View style={styles.form}>
        <Label>{t.auth.email}</Label>
        <Input
          placeholder={t.auth.email}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          textContentType="emailAddress"
          autoComplete="email"
          testID="login-email"
        />
        <Label>{t.auth.password}</Label>
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
      </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingTop: 80,
    paddingBottom: spacing.lg,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  logo: { width: 42, height: 42, borderRadius: 8 },
  brand: { color: '#fff', fontSize: 28, fontWeight: '700' },
  body: { padding: spacing.md, paddingTop: spacing.lg },
  cardHeader: {
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
  },
  cardHeaderText: { fontSize: 16, fontWeight: '600', color: colors.text },
  form: { padding: spacing.md, gap: spacing.sm + 2 },
  link: { alignItems: 'center', paddingVertical: spacing.sm },
  linkText: { color: colors.primaryDark, fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.md },
  muted: { color: colors.textMuted },
});
