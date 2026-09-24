import React, { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Switch, Text, View } from 'react-native';
import { useInfiniteQuery, useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import * as WebBrowser from 'expo-web-browser';
import { items as itemsApi } from '../api/client';
import type { Item, ItemsResponse } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { Button, Centered, Loading } from '../components/ui';
import { useI18n } from '../i18n';
import { colors, spacing } from '../theme';
import { formatDate } from '../utils/date';
import { errorMessage } from '../utils/errors';

const PAGE_SIZE = 50;

export function ItemsScreen() {
  const { t, locale, format } = useI18n();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [unreadOnly, setUnreadOnly] = useState(true);

  const queryKey = ['items', unreadOnly] as const;

  const query = useInfiniteQuery({
    queryKey,
    enabled: !!token,
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      itemsApi.list(token!, { offset: pageParam, limit: PAGE_SIZE, showOnlyUnread: unreadOnly }),
    getNextPageParam: (last) => (last.has_more ? last.offset + last.limit : undefined),
  });

  const markRead = useMutation({
    mutationFn: (vars: { item: Item; unread: boolean }) =>
      itemsApi.markRead(token!, {
        feed_uuid: vars.item.feed_uuid,
        item_url: vars.item.item_url,
        item_title: vars.item.item_title,
        unread: vars.unread,
      }),
    onMutate: ({ item, unread }) => {
      queryClient.setQueriesData<InfiniteData<ItemsResponse>>({ queryKey: ['items'] }, (data) => {
        if (!data) return data;
        return {
          ...data,
          pages: data.pages.map((page) => ({
            ...page,
            total_unread: Math.max(0, page.total_unread + (unread ? 1 : -1)),
            items: page.items.map((i) =>
              i.feed_uuid === item.feed_uuid && i.item_url === item.item_url ? { ...i, is_read: !unread } : i,
            ),
          })),
        };
      });
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['items'] }),
  });

  const openItem = useCallback(
    async (item: Item) => {
      if (!item.is_read) markRead.mutate({ item, unread: false });
      if (item.item_url) {
        await WebBrowser.openBrowserAsync(item.item_url, { presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET });
      }
    },
    [markRead],
  );

  const allItems = query.data?.pages.flatMap((p) => p.items) ?? [];
  const totalUnread = query.data?.pages[0]?.total_unread ?? 0;

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

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <Text style={styles.unreadCount}>{format(t.items.unreadCount, { count: totalUnread })}</Text>
        <View style={styles.toggle}>
          <Text style={styles.toggleLabel}>{t.items.unreadOnly}</Text>
          <Switch value={unreadOnly} onValueChange={setUnreadOnly} trackColor={{ true: colors.primary }} />
        </View>
      </View>
      <FlatList
        data={allItems}
        keyExtractor={(item, index) => `${item.feed_uuid}:${item.item_url}:${index}`}
        contentContainerStyle={allItems.length === 0 ? styles.emptyContainer : undefined}
        refreshControl={<RefreshControl refreshing={query.isRefetching && !query.isFetchingNextPage} onRefresh={() => query.refetch()} />}
        onEndReached={() => {
          if (query.hasNextPage && !query.isFetchingNextPage) query.fetchNextPage();
        }}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <Text style={styles.muted}>{unreadOnly ? t.items.emptyUnread : t.items.empty}</Text>
        }
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            onPress={() => openItem(item)}
            onLongPress={() => markRead.mutate({ item, unread: item.is_read })}
          >
            <View style={styles.dotColumn}>
              {!item.is_read && <View style={styles.dot} />}
            </View>
            <View style={styles.rowBody}>
              <Text style={[styles.itemTitle, item.is_read && styles.readTitle]} numberOfLines={2}>
                {item.item_title || item.item_url}
              </Text>
              <Text style={styles.meta} numberOfLines={1}>
                {item.feed_title} · {formatDate(item.pub_date ?? item.created_at, locale, '')}
              </Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.card,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  unreadCount: { color: colors.primaryDark, fontWeight: '600' },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  toggleLabel: { color: colors.textMuted },
  row: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    paddingVertical: 12,
    paddingRight: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowPressed: { backgroundColor: '#f0fdf4' },
  dotColumn: { width: 28, alignItems: 'center', paddingTop: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.unreadDot },
  rowBody: { flex: 1, gap: 4 },
  itemTitle: { fontSize: 16, color: colors.text, fontWeight: '600' },
  readTitle: { color: colors.textMuted, fontWeight: '400' },
  meta: { fontSize: 12, color: colors.textMuted },
  emptyContainer: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  muted: { color: colors.textMuted, textAlign: 'center' },
});
