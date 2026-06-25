import { getServerSession } from 'next-auth'
import { prisma } from '@ipobaje/db'
import { authOptions } from './auth'

export async function getSession() {
  return getServerSession(authOptions)
}
