import 'server-only'

import type { User } from '@supabase/supabase-js'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function listAllAuthUsers() {
  const users: User[] = []
  const perPage = 100

  for (let page = 1; ; page += 1) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage,
    })

    if (error) {
      return { users, error }
    }

    users.push(...data.users)

    if (data.users.length < perPage) {
      return { users, error: null }
    }
  }
}
