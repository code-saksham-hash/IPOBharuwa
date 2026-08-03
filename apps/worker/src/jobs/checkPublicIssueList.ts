import { prisma } from '@ipopilot/db'
import * as cheerio from 'cheerio'
import { createNotification } from '../services/notification'

const PUBLIC_IPO_LIST_URL = 'https://cdsc.com.np/ipolist'

interface ScrapedRow {
  companyName: string
  shareTypeRaw: string | null
  issueManager: string
  openDate: Date
  closeDate: Date
  estimatedPrice: number | null
}

// Parses "6.25% Prime Bank Debenture 2093 - PDB2093 (IPO - For General Public)"
// into { companyName: "6.25% Prime Bank Debenture 2093 - PDB2093", shareTypeRaw: "IPO - For General Public" }
function splitNameAndType(raw: string): { companyName: string; shareTypeRaw: string | null } {
  const match = raw.match(/^(.*?)\s*\(([^)]+)\)\s*$/)
  if (!match) return { companyName: raw.trim(), shareTypeRaw: null }
  return { companyName: match[1]!.trim(), shareTypeRaw: match[2]!.trim() }
}

async function scrapePublicIssueList(): Promise<ScrapedRow[]> {
  const res = await fetch(PUBLIC_IPO_LIST_URL, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    },
  })
  if (!res.ok) {
    throw new Error(`cdsc.com.np/ipolist returned HTTP ${res.status}`)
  }
  const html = await res.text()
  const $ = cheerio.load(html)

  const rows: ScrapedRow[] = []
  $('table tbody tr').each((_, tr) => {
    const cells = $(tr)
      .find('td')
      .map((__, td) => $(td).text().trim())
      .get()

    if (cells.length < 9) return
    const [, rawName, issueManager, , , appliedUnit, amount, openDateStr, closeDateStr] = cells
    if (!rawName || !openDateStr || !closeDateStr) return

    const { companyName, shareTypeRaw } = splitNameAndType(rawName)
    const appliedUnitNum = Number(appliedUnit)
    const amountNum = Number(amount)
    const estimatedPrice = appliedUnitNum > 0 && Number.isFinite(amountNum / appliedUnitNum)
      ? amountNum / appliedUnitNum
      : null

    rows.push({
      companyName,
      shareTypeRaw,
      issueManager: issueManager ?? '',
      openDate: new Date(openDateStr),
      closeDate: new Date(closeDateStr),
      estimatedPrice,
    })
  })

  return rows
}

export async function checkPublicIssueList(): Promise<void> {
  console.log('[checkPublicIssueList] [lookup]  Checking cdsc.com.np/ipolist...')

  try {
    const rows = await scrapePublicIssueList()
    console.log(`[checkPublicIssueList] [info]  Found ${rows.length} row(s) on the public page`)

    let detected = 0

    for (const row of rows) {
      const alreadyConfigured = await prisma.iPOIssue.findFirst({
        where: { companyName: row.companyName },
      })
      if (alreadyConfigured) continue

      const alreadyDetected = await prisma.detectedIssue.findUnique({
        where: { companyName: row.companyName },
      })
      if (alreadyDetected) continue

      await prisma.detectedIssue.create({
        data: {
          companyName: row.companyName,
          shareTypeRaw: row.shareTypeRaw,
          issueManager: row.issueManager,
          openDate: row.openDate,
          closeDate: row.closeDate,
          estimatedPrice: row.estimatedPrice,
        },
      })

      const usersWithAccounts = await prisma.user.findMany({
        where: { accounts: { some: {} } },
        select: { id: true },
      })

      for (const user of usersWithAccounts) {
        await createNotification({
          userId: user.id,
          type: 'NEW_ISSUE_DETECTED',
          title: `New issue detected: ${row.companyName}`,
          body: `Open ${row.openDate.toDateString()} – ${row.closeDate.toDateString()}. CDSC's discovery API is blocked, so complete the remaining details (share ID, min/max unit) on the IPOs page to enable auto-apply.`,
        })
      }

      detected++
    }

    console.log(
      detected > 0
        ? `[checkPublicIssueList] [Y]  Detected ${detected} new issue(s) awaiting details`
        : '[checkPublicIssueList] [Y]  No new issues',
    )
  } catch (err) {
    console.error('[checkPublicIssueList] [N] ', err instanceof Error ? err.message : err)
  }
}
