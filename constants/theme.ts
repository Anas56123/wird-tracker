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
  primary: '#059669', // Sophisticated Emerald for Dark Mode
  secondary: '#064E3B',
  accent: '#FBBF24',
  background: '#040608', 
  text: '#F8FAFC',
  border: '#1E293B',
  card: '#0D1117', 
  placeholder: '#64748B',
  error: '#F87171',
  success: '#10B981',
  icon: '#94A3B8',
  radius: 24,
};

export const BoyTheme = GreenTheme;

export const GirlTheme = {
  primary: '#EC4899',
  secondary: '#FDF2F8',
  accent: '#FDE68A',
  background: '#FFF1F2',
  text: '#831843',
  border: '#FCE7F3',
  card: '#FFFFFF',
  placeholder: '#D1D5DB',
  error: '#EF4444',
  success: '#10B981',
  icon: '#EC4899',
  radius: 24,
};

export const PinkTheme = GirlTheme;

export const DarkPinkTheme = {
  primary: '#F472B6',
  secondary: '#500724',
  accent: '#FBBF24',
  background: '#0A0105', // Deep dark rose/black
  text: '#FDF2F8',
  border: '#4C0519',
  card: '#160209', // Very dark card
  placeholder: '#9D174D',
  error: '#FB7185',
  success: '#34D399',
  icon: '#F472B6',
  radius: 24,
};

export const Colors = {
  light: GreenTheme,
  dark: DarkTheme,
};

export type Theme = typeof GreenTheme;
