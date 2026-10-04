import type { Item } from '../api/types';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type ItemsStackParamList = {
  ItemsList: undefined;
  ItemViewer: { item: Item };
};

export type MainTabParamList = {
  ItemsTab: undefined;
  FeedsTab: undefined;
  SettingsTab: undefined;
};

export type SettingsStackParamList = {
  SettingsHome: undefined;
  DeleteAccount: undefined;
};
