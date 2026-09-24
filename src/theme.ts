export const colors = {
  primary: '#19A5AA',
  primaryDark: '#178B8F',
  primaryDarker: '#166B70',
  green: '#10b981',
  greenDark: '#059669',
  greenDarker: '#047857',
  background: '#f2fafa',
  card: '#ffffff',
  surface: '#f8fafc',
  surfaceMuted: '#f1f5f9',
  readBackground: '#f1f5f9',
  text: '#1e293b',
  textMuted: '#64748b',
  border: '#e2e8f0',
  borderStrong: '#cbd5e1',
  danger: '#dc2626',
  slate: '#64748b',
  slateDark: '#475569',
  unreadDot: '#19A5AA',
};

export const gradients = {
  header: ['#19A5AA', '#059669', '#047857'] as const,
  headerStart: { x: 0, y: 0 },
  headerEnd: { x: 1, y: 1 },
  primaryButton: ['#19A5AA', '#178B8F'] as const,
  feedCardBar: ['#10b981', '#059669', '#047857'] as const,
};

export const statusColors = {
  active: { background: '#dcfdf7', text: '#065f46', border: '#10b981' },
  draft: { background: '#fefce8', text: '#92400e', border: '#f59e0b' },
  past: { background: '#fef2f2', text: '#991b1b', border: '#ef4444' },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
};

export const radii = {
  sm: 6,
  md: 8,
  lg: 12,
  pill: 9999,
};

export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
};

export const LOGO_URL = 'https://craft-feed-storage2.s3.us-east-2.amazonaws.com/craftfeed_logo.png';
