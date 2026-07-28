import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/session'

// Re-checked on every admin server action independent of any UI-level
// hiding of the Admin nav item — a logged-in non-admin calling one of these
// actions directly must still be rejected.
export async function requireAdmin() {
  const session = await getServerSession()
  if (!session) throw new Error('Not authenticated')

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: { role: true },
  })
  if (user.role !== 'ADMIN') throw new Error('Not authorized')

  return session
}
