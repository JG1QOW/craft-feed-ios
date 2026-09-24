export type Language = 'English' | 'Japanese';

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  language: Language | null;
  subscription_status?: string | null;
  ai_settings?: unknown;
  created_at?: string;
}

export interface TokenResponse {
  token: string;
  token_type: string;
  user: User;
}

export type FeedStatus = 'active' | 'draft' | 'past';

export interface Feed {
  id?: number;
  uuid: string;
  feed_title: string;
  feed_url?: string;
  source_url: string;
  status: FeedStatus | null;
  last_status?: string | null;
  last_update_time?: string;
  latest_item_created_at?: string | null;
  user_id?: number | null;
  category_id?: number | null;
  folder_id?: number | null;
  source_id?: number | null;
}

export interface Item {
  feed_title: string;
  item_title: string;
  item_url: string;
  item_content: string;
  feed_uuid: string;
  feed_updated: string | null;
  pub_date: string | null;
  created_at: string | null;
  is_read: boolean;
}

export interface ItemsResponse {
  items: Item[];
  total: number;
  total_all: number;
  total_unread: number;
  offset: number;
  limit: number;
  has_more: boolean;
}
