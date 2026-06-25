import { prisma } from '@ipobaje/db'

type NotificationTypeValue =
  | 'NEW_IPO_OPEN'
  | 'AUTO_APPLY_SUCCESS'
  | 'AUTO_APPLY_FAILED'
  | 'RESULT_ALLOTTED'
  | 'RESULT_NOT_ALLOTTED'

export async function createNotification(params: {
  userId: string
  type: NotificationTypeValue
  title: string
  body: string
}): Promise<void> {
  try {
    await prisma.notification.create({ data: params })
    console.log(`[notification] [Y]  ${params.type}: ${params.title}`)
  } catch (err) {
    console.error(`[notification] [N]  Failed to create:`, err instanceof Error ? err.message : err)
  }
}
