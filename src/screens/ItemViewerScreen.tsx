import React, { useLayoutEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Centered, ReadCheckbox } from '../components/ui';
import { useI18n } from '../i18n';
import { useMarkRead } from '../items/useMarkRead';
import type { ItemsStackParamList } from '../navigation/types';
import { colors, spacing } from '../theme';

type Props = NativeStackScreenProps<ItemsStackParamList, 'ItemViewer'>;

export function ItemViewerScreen({ navigation, route }: Props) {
  const { item } = route.params;
  const { t } = useI18n();
  const markRead = useMarkRead();
  const [isRead, setIsRead] = useState(item.is_read);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <ReadCheckbox
          checked={!isRead}
          onPress={() => {
            markRead.mutate({ item, unread: isRead });
            setIsRead(!isRead);
          }}
          label={isRead ? t.items.markUnread : t.items.markRead}
          onDark
        />
      ),
    });
  }, [navigation, isRead, item, markRead, t]);

  if (!item.item_url) {
    return (
      <Centered>
        <Text style={styles.muted}>{t.items.noUrl}</Text>
      </Centered>
    );
  }

  return (
    <WebView
      source={{ uri: item.item_url }}
      style={styles.web}
      startInLoadingState
      renderLoading={() => (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  web: { flex: 1, backgroundColor: colors.card },
  loading: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card },
  muted: { color: colors.textMuted, textAlign: 'center', padding: spacing.lg },
});
