import { useEffect, useState } from 'react'
import { Animated, Easing, Image, StyleSheet } from 'react-native'
import unblindSlogan from '../../assets/brand/unblind-slogan-relief-v5.png'
import { useAuth } from '@/providers/AuthProvider'
import { colors } from '@/constants/design'

export function NativeLaunchTransition() {
  const { session, loading, profileComplete, accountReady } = useAuth()
  const [visible, setVisible] = useState(true)
  const [surfaceOpacity] = useState(() => new Animated.Value(1))
  const [logoOpacity] = useState(() => new Animated.Value(1))
  const [logoScale] = useState(() => new Animated.Value(1))
  const appReady = !loading && (!session || (profileComplete !== null && accountReady))

  useEffect(() => {
    if (!appReady) return

    const transition = Animated.sequence([
      Animated.delay(180),
      Animated.parallel([
        Animated.timing(logoOpacity, {
          duration: 260,
          easing: Easing.inOut(Easing.cubic),
          toValue: 0,
          useNativeDriver: true,
        }),
        Animated.timing(logoScale, {
          duration: 260,
          easing: Easing.out(Easing.cubic),
          toValue: 1.025,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(surfaceOpacity, {
        duration: 420,
        easing: Easing.out(Easing.cubic),
        toValue: 0,
        useNativeDriver: true,
      }),
    ])

    transition.start(({ finished }) => {
      if (finished) setVisible(false)
    })

    return () => transition.stop()
  }, [appReady, logoOpacity, logoScale, surfaceOpacity])

  if (!visible) return null

  return (
    <Animated.View
      accessibilityLabel="언블라인드 시작 화면"
      style={[styles.overlay, { opacity: surfaceOpacity }]}
    >
      <Animated.View
        style={{
          opacity: logoOpacity,
          transform: [{ scale: logoScale }],
        }}
      >
        <Image
          accessibilityLabel="Was Blind, Now See"
          alt="Was Blind, Now See"
          resizeMode="contain"
          source={unblindSlogan}
          style={styles.logo}
        />
      </Animated.View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    backgroundColor: colors.brand,
    elevation: 9999,
    justifyContent: 'center',
    zIndex: 9999,
  },
  logo: {
    height: 172,
    width: 172,
  },
})
