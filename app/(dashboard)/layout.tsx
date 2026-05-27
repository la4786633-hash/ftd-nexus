import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { getServerUser } from '@/lib/supabase/server'
import { AppShell } from '@/components/layout/AppShell'

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const profile = await getServerUser()
  if (!profile) redirect('/login')

  return <AppShell>{children}</AppShell>
}
