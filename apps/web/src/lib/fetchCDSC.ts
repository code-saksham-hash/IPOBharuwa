import { decrypt } from './crypto'
import { MeroShareClient } from '@ipopilot/meroshare-client'

export interface CDSCCredentials {
  dpId: number
  boid: string
  username?: string | null
  encryptedPassword: string
  encryptionIv: string
  encryptionTag: string
}

export interface CDSCSession {
  token: string
  cookie: string
}

export interface CDSCAccountError {
  boid: string
  dpName: string
  category: 'CREDENTIAL_ERROR' | 'WAF_ERROR' | 'NETWORK_ERROR' | 'UNEXPECTED_ERROR'
  message: string
}

export async function loginToCDSC(credentials: CDSCCredentials): Promise<CDSCSession> {
  let password: string
  try {
    password = decrypt({
      cipher: credentials.encryptedPassword,
      iv: credentials.encryptionIv,
      tag: credentials.encryptionTag,
    })
  } catch (err) {
    throw new Error(
      `Failed to decrypt password for BOID …${credentials.boid.slice(-6)} — encryption key may have changed`,
    )
  }

  const loginUsername = credentials.username || credentials.boid
  console.log('[fetchCDSC] Logging into CDSC via direct client:', {
    dpId: credentials.dpId,
    usernameUsed: loginUsername.length === 16 ? `…${loginUsername.slice(-6)}` : loginUsername,
    boid: `…${credentials.boid.slice(-6)}`,
    usernameIsBoid: loginUsername === credentials.boid,
  })

  const client = new MeroShareClient()
  try {
    const result = await client.login(credentials.dpId, loginUsername, password)
    const token = client.getToken()
    if (!token) {
      throw new Error('CDSC login succeeded but no token was returned')
    }
    console.log('[fetchCDSC] [Y]  CDSC login successful, token length:', token.length)
    return { token, cookie: '' }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    const statusCode = (err as { statusCode?: number }).statusCode
    if (statusCode === 401) {
      throw new Error(`Invalid credentials for ${loginUsername === credentials.boid ? 'BOID' : 'username'} …${loginUsername.slice(-6)} (DP: ${credentials.dpId}). ${msg}`)
    }
    if (statusCode === 403 || statusCode === 429) {
      throw new Error(`CDSC blocked login (HTTP ${statusCode}) — ${msg}`)
    }
    throw new Error(`CDSC login failed: ${msg}`)
  }
}

function createAuthenticatedClient(session: CDSCSession): MeroShareClient {
  const client = new MeroShareClient()
  client.setToken(session.token)
  return client
}

export async function fetchActiveApplications(
  session: CDSCSession,
): Promise<Array<Record<string, unknown>>> {
  console.log('[fetchCDSC] Fetching /applicantForm/active/search/ (size=200) via direct client')
  const client = createAuthenticatedClient(session)
  try {
    const result = await client.searchApplications({
      filterFieldParams: [],
      page: 0,
      size: 200,
      searchRoleViewConstants: 'VIEW_APPLICANT_FORM_COMPLETE',
      filterDateParams: [
        { key: 'appliedDate', condition: '', alias: '', value: '' },
        { key: 'appliedDate', condition: '', alias: '', value: '' },
      ],
      sortBy: 'appliedDate',
      sortAsc: false,
    })
    console.log(`[fetchCDSC] Active applications: ${result.object?.length ?? 0} records (total: ${result.totalCount})`)
    return (result.object as Array<Record<string, unknown>>) ?? []
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    const body = (err as { responseBody?: string }).responseBody
    console.warn(`[fetchCDSC] /applicantForm/active/search/ failed: ${msg}`, body ? `\n[fetchCDSC] response body: ${body}` : '')
    throw new Error(`CDSC /applicantForm/active/search/: ${msg}`)
  }
}

export async function fetchMigratedApplications(
  session: CDSCSession,
): Promise<Array<Record<string, unknown>>> {
  console.log('[fetchCDSC] Fetching /migrated/applicantForm/search/ (size=200) via direct client')
  const client = createAuthenticatedClient(session)
  try {
    const result = await client.searchMigratedApplications({
      filterFieldParams: [],
      page: 0,
      size: 200,
      searchRoleViewConstants: 'VIEW_APPLICANT_FORM_COMPLETE',
      filterDateParams: [
        { key: 'appliedDate', condition: '', alias: '', value: '' },
        { key: 'appliedDate', condition: '', alias: '', value: '' },
      ],
      sortBy: 'appliedDate',
      sortAsc: false,
    })
    console.log(`[fetchCDSC] Migrated applications: ${result.object?.length ?? 0} records (total: ${result.totalCount})`)
    return (result.object as Array<Record<string, unknown>>) ?? []
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    const body = (err as { responseBody?: string }).responseBody
    console.warn(`[fetchCDSC] /migrated/applicantForm/search/ failed: ${msg}`, body ? `\n[fetchCDSC] response body: ${body}` : '')
    throw new Error(`CDSC /migrated/applicantForm/search/: ${msg}`)
  }
}

export async function fetchAllApplications(
  session: CDSCSession,
): Promise<{ records: Array<Record<string, unknown>>; errors: string[] }> {
  const [activeResult, migratedResult] = await Promise.allSettled([
    fetchActiveApplications(session),
    fetchMigratedApplications(session),
  ])

  const errors: string[] = []
  const merged: Array<Record<string, unknown>> = []
  const seen = new Set<number>()

  if (activeResult.status === 'fulfilled') {
    for (const record of activeResult.value) {
      const id = record.companyShareId as number | undefined
      if (id !== undefined) {
        if (seen.has(id)) continue
        seen.add(id)
      }
      merged.push(record)
    }
  } else {
    errors.push(`Active applications: ${activeResult.reason instanceof Error ? activeResult.reason.message : String(activeResult.reason)}`)
  }

  if (migratedResult.status === 'fulfilled') {
    for (const record of migratedResult.value) {
      const id = record.companyShareId as number | undefined
      if (id !== undefined) {
        if (seen.has(id)) continue
        seen.add(id)
      }
      merged.push(record)
    }
  } else {
    errors.push(`Migrated applications: ${migratedResult.reason instanceof Error ? migratedResult.reason.message : String(migratedResult.reason)}`)
  }

  console.log(`[fetchCDSC] Applications: ${merged.length} records, ${errors.length} endpoint error(s)`)
  return { records: merged, errors }
}
