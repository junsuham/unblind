import { useColorScheme } from 'react-native'

const shared = {
  brand: '#E45330',
  brandSoft: '#FFF1E9',
  logoSurface: '#E45330',
  wordmarkSurface: '#E45330',
  sloganSurface: '#E45330',
  kakao: '#FEE500',
  danger: '#FF3B30',
  success: '#2D8A5B',
}

export const lightColors = {
  ...shared,
  background: '#E45330',
  surface: 'rgba(255,255,255,0.92)',
  surfaceStrong: '#FFFFFF',
  surfaceMuted: '#F2F2F7',
  tabSurface: '#FFFFFF',
  text: '#000000',
  textSecondary: 'rgba(60,60,67,0.68)',
  textTertiary: 'rgba(60,60,67,0.48)',
  textOnBrand: '#FFFFFF',
  textOnBrandSecondary: 'rgba(255,255,255,0.86)',
  separator: 'rgba(209,209,214,0.72)',
  border: 'rgba(255,255,255,0.72)',
}

export const darkColors = {
  ...shared,
  brand: '#E45330',
  background: '#140F0D',
  surface: 'rgba(37,37,39,0.97)',
  surfaceStrong: '#1D1D1F',
  surfaceMuted: '#3A3A3C',
  tabSurface: '#1D1D1F',
  text: '#F7F7F8',
  textSecondary: 'rgba(235,235,245,0.72)',
  textTertiary: 'rgba(235,235,245,0.52)',
  textOnBrand: '#FFF8F4',
  textOnBrandSecondary: 'rgba(255,248,244,0.8)',
  separator: 'rgba(99,99,102,0.72)',
  border: 'rgba(255,138,86,0.2)',
}

export const colors = lightColors

export function useAppTheme() {
  const colorScheme = useColorScheme()
  return colorScheme === 'dark' ? darkColors : lightColors
}

export const radius = {
  small: 12,
  medium: 18,
  large: 24,
}
