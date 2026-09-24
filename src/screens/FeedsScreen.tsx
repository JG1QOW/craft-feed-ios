import React from 'react';
import { ActionSheetIOS, Alert, FlatList, Platform, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as WebBrowser from 'expo-web-browser';
import { LinearGradient } from 'expo-linear-gradient';
import { feeds as feedsApi } from '../api/client';
import type { Feed, FeedStatus } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { Button, Centered, CountPill, Loading } from '../components/ui';
import { API_BASE_URL } from '../config';
import { useI18n } from '../i18n';
import { colors, gradients, radii, shadow, spacing, statusColors } from '../theme';
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
      contentContainerStyle={feeds.length === 0 ? styles.emptyContainer : styles.listContent}
      refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => query.refetch()} />}
      ListHeaderComponent={
        <View style={styles.listHeader}>
          <CountPill>{format(t.feeds.feedCount, { count: feeds.length })}</CountPill>
        </View>
      }
      ListEmptyComponent={<Text style={styles.muted}>{t.feeds.empty}</Text>}
      renderItem={({ item: feed }) => {
        const status = (feed.status ?? 'active') as FeedStatus;
        const palette = statusColors[status] ?? statusColors.active;
        const isActive = status === 'active';
        return (
          <Pressable
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            onPress={() => showActions(feed)}
            testID={`feed-${feed.uuid}`}
          >
            <LinearGradient
              colors={gradients.feedCardBar}
              start={gradients.headerStart}
              end={gradients.headerEnd}
              style={styles.cardBar}
            />
            <Text style={styles.title} numberOfLines={2}>
              {feed.feed_title}
            </Text>
            <View style={styles.chips}>
              <View style={styles.idChip}>
                <Text style={styles.idChipText} numberOfLines={1}>
                  {t.feeds.id}: {feed.uuid}
                </Text>
              </View>
              {!!feed.source_url && (
                <Pressable
                  accessibilityRole="link"
                  hitSlop={6}
                  onPress={() => void WebBrowser.openBrowserAsync(feed.source_url)}
                  style={styles.sourceChip}
                >
                  <Text style={styles.sourceChipText}>{t.feeds.sourcePage}</Text>
                </Pressable>
              )}
            </View>
            <View style={styles.urlBox}>
              <Text style={styles.urlText} numberOfLines={1}>
                {feedRssUrl(feed)}
              </Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.meta}>
                {t.feeds.latestItem}: {formatDate(feed.latest_item_created_at, locale, t.feeds.never)}
              </Text>
              <View style={[styles.status, { backgroundColor: palette.background, borderColor: palette.border }]}>
                <Text style={[styles.statusText, { color: palette.text }]}>{t.feeds.status[status] ?? status}</Text>
              </View>
            </View>
            <View style={styles.actions}>
              <Button
                compact
                title={isActive ? t.feeds.pause : t.feeds.resume}
                style={styles.actionButton}
                onPress={() => setStatus.mutate({ uuid: feed.uuid, status: isActive ? 'draft' : 'active' })}
              />
              <Button compact variant="slate" title={t.common.delete} style={styles.actionButton} onPress={() => confirmDelete(feed)} />
            </View>
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  listContent: { padding: 12, paddingBottom: spacing.lg, gap: 12 },
  listHeader: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 4 },
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    paddingTop: spacing.md + 4,
    gap: 10,
    overflow: 'hidden',
    ...shadow.card,
  },
  cardBar: { position: 'absolute', top: 0, left: 0, right: 0, height: 4 },
  cardPressed: { borderColor: 'rgba(16, 185, 129, 0.3)' },
  title: { fontSize: 17, fontWeight: '600', color: colors.text, lineHeight: 22 },
  chips: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  idChip: { flexShrink: 1, backgroundColor: colors.surfaceMuted, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  idChipText: { fontSize: 11, color: colors.textMuted, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  sourceChip: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.3)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  sourceChipText: { fontSize: 11, color: colors.greenDark, fontWeight: '500' },
  urlBox: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    padding: 8,
  },
  urlText: { fontSize: 12, color: colors.textMuted },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  meta: { flex: 1, fontSize: 12, color: colors.textMuted },
  status: { borderWidth: 1, borderRadius: radii.md, paddingHorizontal: 12, paddingVertical: 6 },
  statusText: { fontSize: 13, fontWeight: '500' },
  actions: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceMuted,
  },
  actionButton: { flex: 1 },
  emptyContainer: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  muted: { color: colors.textMuted, textAlign: 'center' },
});
