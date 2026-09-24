import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import { account } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { Segmented } from '../components/ui';
import { API_BASE_URL } from '../config';
import { languageFromLocale, useI18n } from '../i18n';
import type { Locale } from '../i18n/translations';
import type { SettingsStackParamList } from '../navigation/types';
import { colors, radii, shadow, spacing } from '../theme';
import { errorMessage } from '../utils/errors';

type Props = NativeStackScreenProps<SettingsStackParamList, 'SettingsHome'>;

function Row({ label, value, onPress, danger }: { label: string; value?: string; onPress?: () => void; danger?: boolean }) {
  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      accessibilityRole={onPress ? 'button' : undefined}
    >
      <Text style={[styles.rowLabel, danger && styles.danger]}>{label}</Text>
      {value !== undefined && <Text style={styles.rowValue}>{value}</Text>}
    </Pressable>
  );
}

export function SettingsScreen({ navigation }: Props) {
  const { t, locale } = useI18n();
  const { user, token, logout, setUser } = useAuth();
  const [saving, setSaving] = useState(false);

  const changeLanguage = async (next: Locale) => {
    if (!user || !token || next === locale || saving) return;
    setSaving(true);
    try {
      const res = await account.updateProfile(token, {
        name: user.name,
        email: user.email,
        language: languageFromLocale(next),
      });
      setUser({ ...user, ...res.user });
    } catch (e) {
      Alert.alert(t.common.error, errorMessage(e, t.common.networkError));
    } finally {
      setSaving(false);
    }
  };

  const confirmLogout = () => {
    Alert.alert(t.auth.logout, t.settings.logoutConfirm, [
      { text: t.common.cancel, style: 'cancel' },
      { text: t.auth.logout, style: 'destructive', onPress: () => void logout() },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.section}>{t.settings.account}</Text>
      <View style={styles.card}>
        <Row label={t.auth.name} value={user?.name} />
        <Row label={t.auth.email} value={user?.email} />
        <Row label={t.settings.plan} value={user?.role} />
      </View>

      <Text style={styles.section}>{t.settings.language}</Text>
      <View style={[styles.card, styles.languageCard]}>
        <Segmented<Locale>
          value={locale}
          onChange={(v) => void changeLanguage(v)}
          options={[
            { value: 'en', label: t.settings.english },
            { value: 'ja', label: t.settings.japanese },
          ]}
        />
      </View>

      <View style={styles.card}>
        <Row label={t.settings.website} onPress={() => void WebBrowser.openBrowserAsync(API_BASE_URL)} />
        <Row label={t.auth.logout} onPress={confirmLogout} />
        <Row label={t.settings.deleteAccount} danger onPress={() => navigation.navigate('DeleteAccount')} />
      </View>

      <Text style={styles.version}>
        {t.settings.version} {Constants.expoConfig?.version ?? ''}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.sm, paddingBottom: spacing.lg },
  section: { color: colors.primaryDark, fontSize: 14, fontWeight: '600', marginTop: spacing.md, marginLeft: spacing.xs },
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  languageCard: { padding: spacing.md },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowPressed: { backgroundColor: '#e6f7f7' },
  rowLabel: { fontSize: 16, color: colors.text, fontWeight: '500' },
  rowValue: { fontSize: 15, color: colors.textMuted, maxWidth: '60%' },
  danger: { color: colors.danger },
  version: { textAlign: 'center', color: colors.textMuted, fontSize: 12, marginTop: spacing.lg },
});
