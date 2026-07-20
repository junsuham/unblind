import { requireAdmin } from '@/lib/adminAuth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { AdminHeader, AdminPageShell } from '@/app/admin/components/AdminIOS'
import { Emoji3D } from '@/app/components/ui/Emoji3D'
import Top100Editor from './Top100Editor'

export const dynamic = 'force-dynamic'
export default async function AdminTop100Page() { await requireAdmin(); const { data } = await supabaseAdmin.from('top100_tracks').select('id, rank, youtube_id, title, artist, is_active').order('rank'); return <AdminPageShell><AdminHeader title={<span className="inline-flex items-center gap-2"><Emoji3D name="musicDisc" size={34} />오・찬・추</span>} /><Top100Editor tracks={data ?? []} /></AdminPageShell> }
