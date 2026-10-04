import { useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { items as itemsApi } from '../api/client';
import type { Item, ItemsResponse } from '../api/types';
import { useAuth } from '../auth/AuthContext';

export function useMarkRead() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
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
}
