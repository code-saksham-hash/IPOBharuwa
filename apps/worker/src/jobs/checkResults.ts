import { prisma } from '@ipopilot/db'
import { MeroShareClient } from '@ipopilot/meroshare-client'
import { decrypt } from '../crypto'
import { createNotification } from '../services/notification'

export async function checkResults(): Promise<void> {
  console.log('[checkResults] [lookup]  Checking allotment results...')

  try {
    const applications = await prisma.iPOApplication.findMany({
      where: {
        status: 'APPLIED',
        resultCheckedAt: null,
        issue: {
          closeDate: { lt: new Date() },
        },
      },
      include: {
        account: { include: { user: true } },
        issue: true,
      },
    })

    if (applications.length === 0) {
      console.log('[checkResults] [Y]  No applications to check')
      return
    }

    console.log(`[checkResults] [info]  Checking ${applications.length} application(s)`)

    for (const app of applications) {
      try {
        const password = decrypt({
          cipher: app.account.encryptedPassword,
          iv: app.account.encryptionIv,
          tag: app.account.encryptionTag,
        })

        const client = new MeroShareClient()
        await client.login(app.account.dpId, app.account.username || app.account.boid, password)

        const searchResult = await client.searchApplications({
          filterFieldParams: [],
          page: 0,
          size: 50,
          searchRoleViewConstants: 'VIEW_APPLICANT_FORM_COMPLETE',
          filterDateParams: [
            { key: 'appliedDate', condition: '', alias: '', value: '' },
            { key: 'appliedDate', condition: '', alias: '', value: '' },
          ],
          sortBy: 'appliedDate',
          sortAsc: false,
        })

        const objects = searchResult.object as Array<Record<string, unknown>>
        const match = objects.find(
          (obj) => obj.companyShareId === app.issue.companyShareId,
        ) as Record<string, unknown> | undefined

        if (match) {
          const statusName = match.statusName as string | undefined

          if (statusName === 'Alloted') {
            const allottedKitta = (match.appliedKitta ?? match.allottedKitta ?? 0) as number
            await prisma.iPOApplication.update({
              where: { id: app.id },
              data: {
                status: 'ALLOTTED',
                allottedKitta,
                resultCheckedAt: new Date(),
              },
            })
            await createNotification({
              userId: app.account.userId,
              type: 'RESULT_ALLOTTED',
              title: `Allotted: ${app.issue.scrip}`,
              body: `You were allotted ${allottedKitta} units of ${app.issue.companyName}.`,
            })
            console.log(`[checkResults] [Y]  ALLOTTED: ${app.issue.scrip} (${app.account.boid.slice(-6)})`)
          } else {
            await prisma.iPOApplication.update({
              where: { id: app.id },
              data: {
                status: 'NOT_ALLOTTED',
                resultCheckedAt: new Date(),
              },
            })
            await createNotification({
              userId: app.account.userId,
              type: 'RESULT_NOT_ALLOTTED',
              title: `Not allotted: ${app.issue.scrip}`,
              body: `You were not allotted ${app.issue.companyName}. Better luck next time.`,
            })
            console.log(`[checkResults] [N]  NOT ALLOTTED: ${app.issue.scrip} (${app.account.boid.slice(-6)})`)
          }
        } else {
          await prisma.iPOApplication.update({
            where: { id: app.id },
            data: { resultCheckedAt: new Date() },
          })
          console.log(`[checkResults] [warn]  No match found for ${app.issue.scrip}`)
        }
      } catch (err) {
        console.error(
          `[checkResults] [N]  Error checking ${app.issue.scrip}:`,
          err instanceof Error ? err.message : err,
        )
      }
    }

    console.log('[checkResults] [Y]  Allotment check complete')
  } catch (err) {
    console.error('[checkResults] [N] ', err instanceof Error ? err.message : err)
  }
}
