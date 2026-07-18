import { requireBetaUser } from '@/lib/betaAuth'
import NewPostForm from './NewPostForm'

const validBoards = ['prayer', 'faith', 'daily'] as const

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
