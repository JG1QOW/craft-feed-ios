import React, { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useInfiniteQuery, useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import * as WebBrowser from 'expo-web-browser';
import { items as itemsApi } from '../api/client';
import type { Item, ItemsResponse } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { Button, Centered, CountPill, Loading, Segmented } from '../components/ui';
import { useI18n } from '../i18n';
import { colors, radii, shadow, spacing } from '../theme';
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
        <Segmented
          value={unreadOnly ? 'unread' : 'all'}
          onChange={(v) => setUnreadOnly(v === 'unread')}
          options={[
            { value: 'all', label: t.items.all },
            { value: 'unread', label: t.items.unreadOnly },
          ]}
        />
        <CountPill>{format(t.items.unreadCount, { count: totalUnread })}</CountPill>
      </View>
      <FlatList
        data={allItems}
        keyExtractor={(item, index) => `${item.feed_uuid}:${item.item_url}:${index}`}
        contentContainerStyle={allItems.length === 0 ? styles.emptyContainer : styles.listContent}
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
            style={({ pressed }) => [styles.card, item.is_read && styles.cardRead, pressed && styles.cardPressed]}
            onPress={() => openItem(item)}
            onLongPress={() => markRead.mutate({ item, unread: item.is_read })}
          >
            <View style={styles.cardTop}>
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: !item.is_read }}
                accessibilityLabel={item.is_read ? t.items.markUnread : t.items.markRead}
                hitSlop={8}
                onPress={() => markRead.mutate({ item, unread: item.is_read })}
                style={[styles.checkbox, !item.is_read && styles.checkboxChecked]}
              >
                {!item.is_read && <Text style={styles.checkmark}>✓</Text>}
              </Pressable>
              <Text style={styles.feedTitle} numberOfLines={1}>
                {item.feed_title}
              </Text>
              <Text style={styles.date}>{formatDate(item.pub_date ?? item.created_at, locale, '')}</Text>
            </View>
            <Text style={[styles.itemTitle, item.is_read && styles.readTitle]} numberOfLines={3}>
              {item.item_title || item.item_url}
            </Text>
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
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  listContent: { paddingHorizontal: 12, paddingBottom: spacing.lg, gap: 12 },
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    gap: 8,
    ...shadow.card,
  },
  cardRead: { backgroundColor: colors.readBackground, borderColor: colors.borderStrong },
  cardPressed: { backgroundColor: '#e6f7f7' },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkmark: { color: '#fff', fontSize: 11, fontWeight: '700', lineHeight: 13 },
  feedTitle: { flex: 1, fontSize: 13, fontWeight: '600', color: colors.text },
  date: { fontSize: 12, color: colors.textMuted },
  itemTitle: { fontSize: 15, color: colors.primary, fontWeight: '500', lineHeight: 22 },
  readTitle: { color: colors.textMuted },
  emptyContainer: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  muted: { color: colors.textMuted, textAlign: 'center' },
});
