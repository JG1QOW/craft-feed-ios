import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { useAuth } from '../auth/AuthContext';
import { Button, ErrorText, Input } from '../components/ui';
import { useI18n } from '../i18n';
import { colors, spacing } from '../theme';
import { errorMessage } from '../utils/errors';

export function RegisterScreen() {
  const { t } = useI18n();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError(null);
    setLoading(true);
    try {
      await register(name.trim(), email.trim(), password, confirm);
    } catch (e) {
      setError(errorMessage(e, t.auth.registerFailed));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        <Input placeholder={t.auth.name} value={name} onChangeText={setName} autoCapitalize="words" textContentType="name" />
        <Input
          placeholder={t.auth.email}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          textContentType="emailAddress"
        />
        <Input
          placeholder={t.auth.password}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          textContentType="newPassword"
        />
        <Input
          placeholder={t.auth.passwordConfirmation}
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry
          textContentType="newPassword"
          onSubmitEditing={submit}
        />
        <ErrorText message={error} />
        <Button title={t.auth.register} onPress={submit} loading={loading} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  form: { padding: spacing.lg, gap: spacing.md },
});
