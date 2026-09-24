import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../auth/AuthContext';
import { Button, ErrorText, Input } from '../components/ui';
import { useI18n } from '../i18n';
import { colors, spacing } from '../theme';
import { errorMessage } from '../utils/errors';

export function DeleteAccountScreen() {
  const { t } = useI18n();
  const { deleteAccount } = useAuth();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const confirm = () => {
    Alert.alert(t.settings.deleteAccountTitle, t.settings.deleteAccountWarning, [
      { text: t.common.cancel, style: 'cancel' },
      { text: t.common.delete, style: 'destructive', onPress: submit },
    ]);
  };

  const submit = async () => {
    setError(null);
    setLoading(true);
    try {
      await deleteAccount(password);
    } catch (e) {
      setError(errorMessage(e, t.settings.deleteAccountFailed));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.warning}>{t.settings.deleteAccountWarning}</Text>
      <Input
        placeholder={t.auth.password}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        textContentType="password"
        testID="delete-password"
      />
      <ErrorText message={error} />
      <Button
        title={t.settings.deleteAccount}
        variant="danger"
        onPress={confirm}
        loading={loading}
        disabled={password.length === 0}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg, gap: spacing.md },
  warning: { color: colors.text, fontSize: 15, lineHeight: 22 },
});
