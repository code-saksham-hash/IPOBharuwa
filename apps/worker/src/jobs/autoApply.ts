import { prisma } from '@ipopilot/db'
import { MeroShareClient } from '@ipopilot/meroshare-client'
import { decrypt } from '../crypto'
import { createNotification } from '../services/notification'
import type { Job } from 'bullmq'

export interface AutoApplyJobData {
  applicationId: string
  accountId: string
  issueId: string
}

export async function autoApply(job: Job<AutoApplyJobData>): Promise<void> {
  const { applicationId, accountId, issueId } = job.data

  console.log(`[autoApply] [start]  Processing application ${applicationId}`)

  try {
    const account = await prisma.meroShareAccount.findUnique({
      where: { id: accountId },
      include: { user: true },
    })
    const issue = await prisma.iPOIssue.findUnique({ where: { id: issueId } })

    if (!account || !issue) {
      throw new Error(`Account or issue not found: account=${accountId} issue=${issueId}`)
    }

    if (!account.encryptedTransactionPin || !account.transactionPinIv || !account.transactionPinTag) {
      throw new Error(
        `No transaction PIN set for account ${account.boid.slice(-6)} — add one from the Accounts page before this account can auto-apply`,
      )
    }

    await prisma.iPOApplication.update({
      where: { id: applicationId },
      data: { status: 'APPLYING' },
    })

    const password = decrypt({
      cipher: account.encryptedPassword,
      iv: account.encryptionIv,
      tag: account.encryptionTag,
    })

    const transactionPin = decrypt({
      cipher: account.encryptedTransactionPin,
      iv: account.transactionPinIv,
      tag: account.transactionPinTag,
    })

    const client = new MeroShareClient()
    await client.login(account.dpId, account.username || account.boid, password)
    console.log(`[autoApply] [Y]  Logged in as ${account.boid.slice(-6)}`)

    let bankId = account.bankId
    let accountNumber = account.accountNumber ?? ''
    let accountBranchId = account.accountBranchId
    let crnNumber = account.crnNumber ?? ''
    let customerId = account.customerId

    if (account.accountNumber === null) {
      console.log(`[autoApply] [fetch]  Fetching bank details for BOID ${account.boid}`)

      const ownDetail = await client.getOwnDetail()

      console.log('[autoApply] === RAW /ownDetail/ RESPONSE ===')
      console.log('[autoApply] Full body:', JSON.stringify(ownDetail))
      console.log('[autoApply] Top-level keys:', Object.keys(ownDetail))
      const keysAtDepth = (obj: unknown, depth: number): unknown => {
        if (depth === 0 || typeof obj !== 'object' || obj === null || Array.isArray(obj)) return obj
        const out: Record<string, unknown> = {}
        for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
          out[k] = keysAtDepth(v, depth - 1)
        }
        return out
      }
      console.log('[autoApply] ownDetail key-structure (depth 2):', JSON.stringify(keysAtDepth(ownDetail, 2), null, 2))

      let bankDetail: Record<string, unknown> = {}
      try {
        bankDetail = await client.getBankRequest()
        console.log('[autoApply] === RAW /myBankRequest/ RESPONSE ===')
        console.log('[autoApply] Full body:', JSON.stringify(bankDetail))
        console.log('[autoApply] Top-level keys:', Object.keys(bankDetail))
        console.log('[autoApply] myBankRequest key-structure (depth 2):', JSON.stringify(keysAtDepth(bankDetail, 2), null, 2))
      } catch (err) {
        console.log('[autoApply] [warn]  /myBankRequest/ failed:', err instanceof Error ? err.message : err)
      }

      bankId = (bankDetail.bankId as number) ?? (ownDetail.bankId as number) ?? null
      accountNumber = (bankDetail.accountNumber as string) ?? (ownDetail.accountNumber as string) ?? ''
      accountBranchId = (bankDetail.accountBranchId as number) ?? (ownDetail.accountBranchId as number) ?? null
      crnNumber = (bankDetail.crnNumber as string) ?? (ownDetail.crnNumber as string) ?? ''
      customerId = (bankDetail.customerId as number) ?? (ownDetail.customerId as number) ?? null

      await prisma.meroShareAccount.update({
        where: { id: accountId },
        data: {
          bankId,
          accountNumber,
          accountBranchId,
          crnNumber,
          customerId,
        },
      })
      console.log(`[autoApply] [Y]  Bank details saved`)
    }

    await client.submitApplication({
      accountBranchId: accountBranchId!,
      accountNumber,
      appliedKitta: issue.minUnit,
      bankId: bankId!,
      boid: account.boid,
      companyShareId: issue.companyShareId,
      crnNumber,
      customerId: customerId!,
      demat: account.boid,
      transactionPIN: transactionPin,
    })

    await prisma.iPOApplication.update({
      where: { id: applicationId },
      data: { status: 'APPLIED', appliedAt: new Date() },
    })

    await prisma.meroShareAccount.update({
      where: { id: accountId },
      data: { lastAppliedAt: new Date() },
    })

    await createNotification({
      userId: account.userId,
      type: 'AUTO_APPLY_SUCCESS',
      title: `Applied for ${issue.scrip}`,
      body: `${issue.minUnit} units of ${issue.companyName} at NPR ${issue.issuePrice}.`,
    })

    console.log(`[autoApply] [Y]  Successfully applied for ${issue.scrip} (${account.boid.slice(-6)})`)
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    console.error(`[autoApply] [N]  ${errorMessage}`)

    await prisma.iPOApplication.update({
      where: { id: applicationId },
      data: {
        status: 'FAILED',
        errorMessage,
        retryCount: { increment: 1 },
      },
    })

    const account = await prisma.meroShareAccount.findUnique({
      where: { id: accountId },
      include: { user: true },
    })
    const issue = await prisma.iPOIssue.findUnique({ where: { id: issueId } })

    if (account && issue) {
      await createNotification({
        userId: account.userId,
        type: 'AUTO_APPLY_FAILED',
        title: `Failed: ${issue.scrip}`,
        body: errorMessage,
      })
    }

    throw err
  }
}
