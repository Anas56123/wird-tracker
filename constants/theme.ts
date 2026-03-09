export const GreenTheme = {
  primary: '#006B3E', // Deep Emerald Green
  secondary: '#F0F9F4', // Soft Sage Tint
  accent: '#FFD700', // Gold Accent
  background: '#F7FCF9', // Crisp Off-white with green hint
  text: '#013220', // Night Forest Green
  border: '#E0EAE4',
  card: '#FFFFFF',
  placeholder: '#8CA096',
  error: '#FF5252',
  success: '#00C853',
  icon: '#2E7D32',
  radius: 24, // High radius for squircle look
};

export const DarkTheme = {
  primary: '#34D399', // Emerald 400
  secondary: '#064E3B', // Deep Emerald 900
  accent: '#FBBF24', // Amber 400
  background: '#020617', // Slate 950
  text: '#F8FAFC', // Slate 50
  border: '#1E293B', // Slate 800
  card: '#0F172A', // Slate 900
  placeholder: '#64748B', // Slate 500
  error: '#F87171',
  success: '#10B981',
  icon: '#94A3B8',
  radius: 24,
};

export const BoyTheme = GreenTheme; // Defaulting to Green as per user request

export const GirlTheme = {
  primary: '#EC4899', // Pink 500
  secondary: '#FDF2F8', // Pink 50 tint
  accent: '#FDE68A', // Gold/Amber hint
  background: '#FFF1F2', // Rose 50
  text: '#831843', // Rose 900
  border: '#FCE7F3',
  card: '#FFFFFF',
  placeholder: '#D1D5DB',
  error: '#EF4444',
  success: '#10B981',
  icon: '#EC4899',
  radius: 24,
};

export const Colors = {
  light: GreenTheme,
  dark: DarkTheme,
};

export type Theme = typeof GreenTheme;
