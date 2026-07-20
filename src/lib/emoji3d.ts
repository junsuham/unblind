export const emoji3DAssets = {
  prayer: { src: '/icons/emoji-3d/prayer.png', label: '기도' },
  dove: { src: '/icons/emoji-3d/dove.png', label: '비둘기' },
  sun: { src: '/icons/emoji-3d/sun.png', label: '해' },
  church: { src: '/icons/emoji-3d/church.png', label: '교회' },
  hearts: { src: '/icons/emoji-3d/hearts.png', label: '관계' },
  chat: { src: '/icons/emoji-3d/chat.png', label: '대화' },
  disc: { src: '/icons/emoji-3d/disc.png', label: '찬양' },
  location: { src: '/icons/emoji-3d/location.png', label: '위치' },
  headphones: { src: '/icons/emoji-3d/headphones.png', label: '헤드폰' },
  gift: { src: '/icons/emoji-3d/gift.png', label: '선물' },
  hourglass: { src: '/icons/emoji-3d/hourglass.png', label: '대기' },
  person: { src: '/icons/emoji-3d/person.png', label: '사용자' },
  prohibited: { src: '/icons/emoji-3d/prohibited.png', label: '차단' },
  bell: { src: '/icons/emoji-3d/bell.png', label: '알림' },
  musicDisc: { src: '/icons/emoji-3d/music-disc.png', label: '음반' },
  check: { src: '/icons/emoji-3d/check.png', label: '완료' },
} as const

export type Emoji3DName = keyof typeof emoji3DAssets
