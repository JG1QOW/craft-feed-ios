import React, { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useInfiniteQuery } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { items as itemsApi } from '../api/client';
import type { Item } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { Button, Centered, CountPill, Loading, ReadCheckbox, Segmented } from '../components/ui';
import { useI18n } from '../i18n';
import { useMarkRead } from '../items/useMarkRead';
import type { ItemsStackParamList } from '../navigation/types';
import { colors, radii, shadow, spacing } from '../theme';
import { formatDate } from '../utils/date';
import { errorMessage } from '../utils/errors';

const PAGE_SIZE = 50;

type Props = NativeStackScreenProps<ItemsStackParamList, 'ItemsList'>;

export function ItemsScreen({ navigation }: Props) {
  const { t, locale, format } = useI18n();
  const { token } = useAuth();
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

  const markRead = useMarkRead();

  const openItem = useCallback((item: Item) => navigation.navigate('ItemViewer', { item }), [navigation]);

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
              <ReadCheckbox
                checked={!item.is_read}
                onPress={() => markRead.mutate({ item, unread: item.is_read })}
                label={item.is_read ? t.items.markUnread : t.items.markRead}
              />
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
  feedTitle: { flex: 1, fontSize: 13, fontWeight: '600', color: colors.text },
  date: { fontSize: 12, color: colors.textMuted },
  itemTitle: { fontSize: 15, color: colors.primary, fontWeight: '500', lineHeight: 22 },
  readTitle: { color: colors.textMuted },
  emptyContainer: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  muted: { color: colors.textMuted, textAlign: 'center' },
});
