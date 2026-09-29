/**
 * A calm, intentional visual language (spine product character: quiet, low-pressure, no gamified
 * noise). Warm-neutral grounds, a single soft accent, muted semantic colors. Light + dark.
 */
import { useColorScheme } from 'react-native';

export interface Palette {
  bg: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  text: string;
  textMuted: string;
  accent: string;
  accentSoft: string;
  accentText: string;
  success: string;
  danger: string;
  dangerSoft: string;
}

const light: Palette = {
  bg: '#F6F4EF', // warm off-white
  surface: '#FFFFFF',
  surfaceAlt: '#EFEBE3',
  border: '#E2DCD1',
  text: '#2B2A27',
  textMuted: '#6E6A62',
  accent: '#4E7C6B', // calm sage/teal
  accentSoft: '#DCE8E2',
  accentText: '#FFFFFF',
  success: '#4E7C6B',
  danger: '#9A5B4F', // muted terracotta — used only for safety, never for "failure"
  dangerSoft: '#F0E2DD',
};

const dark: Palette = {
  bg: '#191815',
  surface: '#211F1B',
  surfaceAlt: '#2A2823',
  border: '#3A372F',
  text: '#EDEAE3',
  textMuted: '#A7A296',
  accent: '#8FB6A6',
  accentSoft: '#2C3A34',
  accentText: '#141412',
  success: '#8FB6A6',
  danger: '#C98E80',
  dangerSoft: '#332723',
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 36 } as const;
export const radius = { sm: 8, md: 14, lg: 20, pill: 999 } as const;
export const fontSize = { xs: 12, sm: 14, md: 16, lg: 20, xl: 26, xxl: 34 } as const;

export function useTheme(): { colors: Palette; scheme: 'light' | 'dark' } {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  return { colors: scheme === 'dark' ? dark : light, scheme };
}
