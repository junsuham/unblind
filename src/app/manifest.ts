import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: '언블라인드',
    short_name: '언블라인드',
    description: '청년의 때 고민과 기도 제목을 나누는 익명 공간',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#e45330',
    theme_color: '#e45330',
    lang: 'ko-KR',
    categories: ['social', 'lifestyle'],
    icons: [
      {
        src: '/icons/icon-192-v6.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512-v6.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512-v6.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    shortcuts: [
      {
        name: '기도 나눔',
        short_name: '기도',
        url: '/board/prayer',
        icons: [{ src: '/icons/icon-192-v6.png', sizes: '192x192' }],
      },
      {
        name: '알림',
        short_name: '알림',
        url: '/notifications',
        icons: [{ src: '/icons/icon-192-v6.png', sizes: '192x192' }],
      },
    ],
  }
}
