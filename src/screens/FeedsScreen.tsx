import React from 'react';
import { ActionSheetIOS, Alert, FlatList, Platform, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as WebBrowser from 'expo-web-browser';
import { feeds as feedsApi } from '../api/client';
import type { Feed, FeedStatus } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { Button, Centered, Loading } from '../components/ui';
import { API_BASE_URL } from '../config';
import { useI18n } from '../i18n';
import { colors, spacing } from '../theme';
import { formatDate } from '../utils/date';
import { errorMessage } from '../utils/errors';

export function feedRssUrl(feed: Feed): string {
  return feed.feed_url || `${API_BASE_URL}/feed/${feed.uuid}`;
}

export function FeedsScreen() {
  const { t, locale, format } = useI18n();
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['feeds'],
    enabled: !!token,
    queryFn: () => feedsApi.list(token!),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['feeds'] });
    queryClient.invalidateQueries({ queryKey: ['items'] });
  };

  const setStatus = useMutation({
    mutationFn: (vars: { uuid: string; status: FeedStatus }) => feedsApi.updateStatus(token!, vars.uuid, vars.status),
    onSuccess: (res) => {
      if (!res.success) Alert.alert(t.common.error, res.error ?? t.feeds.statusFailed);
      invalidate();
    },
    onError: (e) => Alert.alert(t.common.error, errorMessage(e, t.feeds.statusFailed)),
  });

  const remove = useMutation({
    mutationFn: (uuid: string) => feedsApi.destroy(token!, uuid),
    onSuccess: invalidate,
    onError: (e) => Alert.alert(t.common.error, errorMessage(e, t.common.networkError)),
  });

  const confirmDelete = (feed: Feed) => {
    Alert.alert(t.feeds.deleteConfirmTitle, format(t.feeds.deleteConfirmBody, { title: feed.feed_title }), [
      { text: t.common.cancel, style: 'cancel' },
      { text: t.common.delete, style: 'destructive', onPress: () => remove.mutate(feed.uuid) },
    ]);
  };

  const showActions = (feed: Feed) => {
    const status = feed.status ?? 'active';
    const toggleLabel = status === 'active' ? t.feeds.pause : t.feeds.resume;
    const toggleStatus: FeedStatus = status === 'active' ? 'draft' : 'active';
    const actions: { label: string; run: () => void; destructive?: boolean }[] = [
      { label: t.feeds.openSource, run: () => void WebBrowser.openBrowserAsync(feed.source_url) },
      { label: toggleLabel, run: () => setStatus.mutate({ uuid: feed.uuid, status: toggleStatus }) },
      { label: t.common.delete, run: () => confirmDelete(feed), destructive: true },
    ];

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: feed.feed_title,
          options: [...actions.map((a) => a.label), t.common.cancel],
          destructiveButtonIndex: actions.findIndex((a) => a.destructive),
          cancelButtonIndex: actions.length,
        },
        (index) => actions[index]?.run(),
      );
    } else {
      Alert.alert(feed.feed_title, undefined, [
        ...actions.map((a) => ({ text: a.label, onPress: a.run, style: a.destructive ? ('destructive' as const) : undefined })),
        { text: t.common.cancel, style: 'cancel' },
      ]);
    }
  };

  if (query.isPending) return <Loading />;

  if (query.isError) {
    return (
      <Centered>
        <Text style={styles.muted}>{errorMessage(query.error, t.common.networkError)}</Text>
        <View style={{ height: spacing.md }} />
        <Button title={t.common.retry} onPress={() => query.refetch()} />
      </Centered>
    );
  }

  const feeds = query.data ?? [];

  return (
    <FlatList
      style={styles.container}
      data={feeds}
      keyExtractor={(f) => f.uuid}
      contentContainerStyle={feeds.length === 0 ? styles.emptyContainer : undefined}
      refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => query.refetch()} />}
      ListEmptyComponent={<Text style={styles.muted}>{t.feeds.empty}</Text>}
      renderItem={({ item: feed }) => {
        const status = (feed.status ?? 'active') as FeedStatus;
        return (
          <Pressable
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            onPress={() => showActions(feed)}
            testID={`feed-${feed.uuid}`}
          >
            <View style={styles.rowHeader}>
              <Text style={styles.title} numberOfLines={1}>
                {feed.feed_title}
              </Text>
              <View style={[styles.badge, status !== 'active' && styles.badgeMuted]}>
                <Text style={[styles.badgeText, status !== 'active' && styles.badgeTextMuted]}>
                  {t.feeds.status[status] ?? status}
                </Text>
              </View>
            </View>
            <Text style={styles.meta} numberOfLines={1}>
              {feed.source_url}
            </Text>
            <Text style={styles.meta}>
              {t.feeds.latestItem}: {formatDate(feed.latest_item_created_at, locale, t.feeds.never)}
            </Text>
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  row: {
    backgroundColor: colors.card,
    padding: spacing.md,
    gap: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowPressed: { backgroundColor: '#f0fdf4' },
  rowHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { flex: 1, fontSize: 16, fontWeight: '600', color: colors.text },
  badge: { backgroundColor: '#d1fae5', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  badgeMuted: { backgroundColor: colors.border },
  badgeText: { fontSize: 12, color: colors.primaryDarker, fontWeight: '600' },
  badgeTextMuted: { color: colors.textMuted },
  meta: { fontSize: 12, color: colors.textMuted },
  emptyContainer: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  muted: { color: colors.textMuted, textAlign: 'center' },
});
