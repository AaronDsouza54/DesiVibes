/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { useColorScheme } from 'react-native';

import { Colors, ThemeColors } from '@/constants/theme';

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: string
) {
  const scheme = useColorScheme();
  const mode = scheme === 'dark' ? 'dark' : 'light';

  const colorFromProps = mode === 'dark' ? props.dark : props.light;
  if (colorFromProps) return colorFromProps;

  const themed = (ThemeColors as any)[mode]?.[colorName];
  if (themed) return themed;

  const token = (Colors as any)[colorName];
  if (token) return token;

  // Sensible default: preserve contrast with theme background.
  return ThemeColors[mode].text;
}
