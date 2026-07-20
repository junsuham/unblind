import { Image, type ImageStyle, type StyleProp } from 'react-native'
import prayer from '../../assets/emoji-3d/prayer.png'
import dove from '../../assets/emoji-3d/dove.png'
import sun from '../../assets/emoji-3d/sun.png'
import church from '../../assets/emoji-3d/church.png'
import hearts from '../../assets/emoji-3d/hearts.png'
import chat from '../../assets/emoji-3d/chat.png'
import disc from '../../assets/emoji-3d/disc.png'
import location from '../../assets/emoji-3d/location.png'
import headphones from '../../assets/emoji-3d/headphones.png'
import gift from '../../assets/emoji-3d/gift.png'
import hourglass from '../../assets/emoji-3d/hourglass.png'
import person from '../../assets/emoji-3d/person.png'
import prohibited from '../../assets/emoji-3d/prohibited.png'
import bell from '../../assets/emoji-3d/bell.png'
import musicDisc from '../../assets/emoji-3d/music-disc.png'
import check from '../../assets/emoji-3d/check.png'

const emoji3DSources = {
  prayer,
  dove,
  sun,
  church,
  hearts,
  chat,
  disc,
  location,
  headphones,
  gift,
  hourglass,
  person,
  prohibited,
  bell,
  musicDisc,
  check,
} as const

const emoji3DLabels: Record<Emoji3DName, string> = {
  prayer: '기도',
  dove: '비둘기',
  sun: '해',
  church: '교회',
  hearts: '관계',
  chat: '대화',
  disc: '찬양',
  location: '위치',
  headphones: '헤드폰',
  gift: '선물',
  hourglass: '대기',
  person: '사용자',
  prohibited: '차단',
  bell: '알림',
  musicDisc: '음반',
  check: '완료',
}

export type Emoji3DName = keyof typeof emoji3DSources

export function Emoji3D({
  name,
  size = 22,
  style,
  decorative = true,
}: {
  name: Emoji3DName
  size?: number
  style?: StyleProp<ImageStyle>
  decorative?: boolean
}) {
  return (
    <Image
      alt={decorative ? '' : emoji3DLabels[name]}
      accessibilityElementsHidden={decorative}
      accessibilityIgnoresInvertColors
      accessibilityLabel={decorative ? undefined : emoji3DLabels[name]}
      accessible={!decorative}
      resizeMode="contain"
      source={emoji3DSources[name]}
      style={[{ height: size, width: size }, style]}
    />
  )
}
