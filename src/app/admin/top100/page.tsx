import { requireAdmin } from '@/lib/adminAuth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { AdminHeader, AdminPageShell } from '@/app/admin/components/AdminIOS'
import Top100Editor from './Top100Editor'

export const dynamic = 'force-dynamic'
export default async function AdminTop100Page() { await requireAdmin(); const { data } = await supabaseAdmin.from('top100_tracks').select('id, rank, youtube_id, title, artist, is_active').order('rank'); return <AdminPageShell><AdminHeader title="📀오・찬・추" /><Top100Editor tracks={data ?? []} /></AdminPageShell> }
