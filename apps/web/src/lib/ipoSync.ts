import { prisma } from '@ipopilot/db'
import { getAutoApplyQueue } from '@/lib/queue'

interface IssueForNotification {
  id: string
  scrip: string
  companyName: string
  minUnit: number
  issuePrice: unknown
}

// Creates a PENDING application + enqueues the auto-apply job + notifies the
// account's owner, unless one already exists for this account/issue pair.
// Returns true if a new application was created.
export async function ensurePendingApplication(
  account: { id: string; userId: string },
  issue: IssueForNotification,
): Promise<boolean> {
  const existing = await prisma.iPOApplication.findUnique({
    where: { accountId_issueId: { accountId: account.id, issueId: issue.id } },
  })
  if (existing) return false

  const application = await prisma.iPOApplication.create({
    data: {
      accountId: account.id,
      issueId: issue.id,
      appliedKitta: issue.minUnit,
      status: 'PENDING',
    },
  })

  await getAutoApplyQueue().add('auto-apply', {
    applicationId: application.id,
    accountId: account.id,
    issueId: issue.id,
  })

  await prisma.notification.create({
    data: {
      userId: account.userId,
      type: 'NEW_IPO_OPEN',
      title: `New IPO: ${issue.scrip}`,
      body: `${issue.companyName} is open. Min ${issue.minUnit} units at NPR ${issue.issuePrice}. Auto-apply queued.`,
    },
  })

  return true
}
