import { router } from 'expo-router'
import { PropsWithChildren } from 'react'
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleProp, View, ViewStyle } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import unblindLogo from '../../assets/brand/unblind-monogram-relief-v5.png'
import { useAppTheme } from '@/constants/design'

type ScreenProps = PropsWithChildren<{
  contentStyle?: StyleProp<ViewStyle>
  showLogo?: boolean
}>

export function Screen({ children, contentStyle, showLogo = true }: ScreenProps) {
  const colors = useAppTheme()

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[{ padding: 18, paddingBottom: 32 }, contentStyle]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {showLogo ? (
            <View
              style={{
                alignItems: 'center',
                backgroundColor: colors.logoSurface,
                marginBottom: 20,
                marginHorizontal: -18,
                marginTop: -18,
                paddingBottom: 8,
                paddingTop: 8,
              }}
            >
              <Pressable
                accessibilityLabel="언블라인드 홈으로 이동"
                hitSlop={10}
                onPress={() => router.replace('/')}
              >
                <Image
                  accessibilityLabel="UNBLIND"
                  alt="UNBLIND"
                  resizeMode="contain"
                  source={unblindLogo}
                  style={{ height: 48, tintColor: colors.logoInk, width: 48 }}
                />
              </Pressable>
            </View>
          ) : null}
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
