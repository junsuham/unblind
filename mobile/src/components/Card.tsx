import { PropsWithChildren } from 'react'
import { StyleProp, View, ViewStyle } from 'react-native'
import { radius, useAppTheme } from '@/constants/design'

export function Card({ children, style }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  const colors = useAppTheme()

  return (
    <View
      style={[
        {
          borderRadius: radius.large,
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderWidth: 1,
          padding: 18,
          shadowColor: '#2C1A10',
          shadowOpacity: 0.06,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 6 },
          elevation: 2,
        },
        style,
      ]}
    >
      {children}
    </View>
  )
}
