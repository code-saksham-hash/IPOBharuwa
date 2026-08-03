import { getServerSession } from 'next-auth'
import { prisma } from '@ipopilot/db'
import { authOptions } from './auth'

export async function getSession() {
  return getServerSession(authOptions)
}

export async function requireSession(): Promise<{ userId: string }> {
  const session = await getSession()
  if (!session?.user?.id) {
    throw new Error('UNAUTHORIZED')
  }
  return { userId: session.user.id }
}
