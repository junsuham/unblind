import type { Metadata } from 'next'
import { requireBetaUser } from '@/lib/betaAuth'
import NewPostForm from './NewPostForm'

const validBoards = ['prayer', 'faith', 'daily'] as const

export const metadata: Metadata = {
  title: '새 글 쓰기 | 언블라인드',
  description: '기도 제목과 고민을 익명으로 안전하게 나눕니다.',
}

type BoardId = (typeof validBoards)[number]

type NewPostPageProps = {
  searchParams: Promise<{
    board?: string
  }>
}

export default async function NewPostPage({ searchParams }: NewPostPageProps) {
  await requireBetaUser()

  const params = await searchParams
  const requestedBoard = params.board

  const initialBoard: BoardId | null = validBoards.includes(requestedBoard as BoardId)
    ? (requestedBoard as BoardId)
    : null

  return <NewPostForm initialBoard={initialBoard} />
}
