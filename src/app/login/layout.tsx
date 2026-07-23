import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '로그인 | 언블라인드',
  description: 'Google 계정으로 언블라인드에 안전하게 로그인하세요.',
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
