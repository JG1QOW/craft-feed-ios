import React from 'react';
import { Text } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../auth/AuthContext';
import { HeaderBackground, HeaderTitle, Loading } from '../components/ui';
import { useI18n } from '../i18n';
import { DeleteAccountScreen } from '../screens/DeleteAccountScreen';
import { FeedsScreen } from '../screens/FeedsScreen';
import { ItemsScreen } from '../screens/ItemsScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { colors } from '../theme';
import type { AuthStackParamList, MainTabParamList, SettingsStackParamList } from './types';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const Tabs = createBottomTabNavigator<MainTabParamList>();
const SettingsStack = createNativeStackNavigator<SettingsStackParamList>();

const headerStyle = {
  headerStyle: { backgroundColor: colors.primary },
  headerTintColor: '#fff',
  headerTitleStyle: { fontWeight: '700' as const },
  headerBackground: () => <HeaderBackground />,
  headerShadowVisible: false,
};

const brandedTitle = (title: string) => ({
  title,
  headerTitle: () => <HeaderTitle title={title} />,
});

function TabIcon({ glyph, color }: { glyph: string; color: string }) {
  return <Text style={{ fontSize: 20, color }}>{glyph}</Text>;
}

function SettingsNavigator() {
  const { t } = useI18n();
  return (
    <SettingsStack.Navigator screenOptions={headerStyle}>
      <SettingsStack.Screen name="SettingsHome" component={SettingsScreen} options={brandedTitle(t.settings.title)} />
      <SettingsStack.Screen
        name="DeleteAccount"
        component={DeleteAccountScreen}
        options={{ title: t.settings.deleteAccountTitle }}
      />
    </SettingsStack.Navigator>
  );
}

function MainTabs() {
  const { t } = useI18n();
  return (
    <Tabs.Navigator
      screenOptions={{
        ...headerStyle,
        tabBarActiveTintColor: colors.primaryDark,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
        tabBarLabelStyle: { fontWeight: '600', fontSize: 11, lineHeight: 16 },
        tabBarItemStyle: { paddingVertical: 2 },
      }}
    >
      <Tabs.Screen
        name="ItemsTab"
        component={ItemsScreen}
        options={{
          ...brandedTitle(t.items.title),
          tabBarLabel: t.tabs.items,
          tabBarIcon: ({ color }) => <TabIcon glyph="☰" color={color} />,
        }}
      />
      <Tabs.Screen
        name="FeedsTab"
        component={FeedsScreen}
        options={{
          ...brandedTitle(t.feeds.title),
          tabBarLabel: t.tabs.feeds,
          tabBarIcon: ({ color }) => <TabIcon glyph="◉" color={color} />,
        }}
      />
      <Tabs.Screen
        name="SettingsTab"
        component={SettingsNavigator}
        options={{
          headerShown: false,
          tabBarLabel: t.tabs.settings,
          tabBarIcon: ({ color }) => <TabIcon glyph="⚙" color={color} />,
        }}
      />
    </Tabs.Navigator>
  );
}

function AuthNavigator() {
  const { t } = useI18n();
  return (
    <AuthStack.Navigator screenOptions={headerStyle}>
      <AuthStack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <AuthStack.Screen name="Register" component={RegisterScreen} options={{ title: t.auth.register }} />
    </AuthStack.Navigator>
  );
}

const navTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, primary: colors.primary, background: colors.background },
};

export function RootNavigator() {
  const { token, loading } = useAuth();
  if (loading) return <Loading />;
  return <NavigationContainer theme={navTheme}>{token ? <MainTabs /> : <AuthNavigator />}</NavigationContainer>;
}
