import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../auth/AuthContext';
import { Button, Card, ErrorText, Input, Label } from '../components/ui';
import { useI18n } from '../i18n';
import { colors, radii, spacing } from '../theme';
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
      <Card style={styles.card}>
      <View style={styles.warningBox}>
        <Text style={styles.warning}>{t.settings.deleteAccountWarning}</Text>
      </View>
      <Label>{t.auth.password}</Label>
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
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.md },
  card: { padding: spacing.md, gap: spacing.sm + 2 },
  warningBox: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: radii.md,
    padding: 12,
    marginBottom: spacing.xs,
  },
  warning: { color: '#991b1b', fontSize: 14, lineHeight: 21 },
});
