import { ENDPOINTS } from './endpoints'
import { MeroShareError } from './errors'

export interface LoginResponse {
  token: string
  isPasswordChanged: boolean
}

export interface DepositoryParticipant {
  id: number
  code: string
  name: string
}

export interface IPOIssue {
  companyShareId: number
  scrip: string
  companyName: string
  shareTypeName: string
  shareGroupName: string
  statusName: string
  openDate: string
  closeDate: string
  minUnit: number
  maxUnit: number
  issuePrice: number
}

export interface IPOIssueDetail extends IPOIssue {
  prospectusUrl?: string
  listingDate?: string
}

export interface BankDetail {
  accountNumber: string
  accountBranchId: number
  bankId: number
  customerId: number
  crnNumber: string
}

export interface ApplicationRequest {
  accountBranchId: number
  accountNumber: string
  appliedKitta: number
  bankId: number
  boid: string
  companyShareId: number
  crnNumber: string
  customerId: number
  demat: string
  transactionPIN: string
}

export interface ApplicationSearchParams {
  filterFieldParams: unknown[]
  page: number
  size: number
  searchRoleViewConstants: string
  // CDSC's backend 500s on some search calls without these — mirror what the
  // real MeroShare web UI sends even when there's no active filter/sort.
  filterDateParams?: Array<{ key: string; condition: string; alias: string; value: string }>
  sortBy?: string
  sortAsc?: boolean
}

export interface ApplicationSearchResponse {
  object: unknown[]
  totalCount: number
}

// CDSC's WAF blocks plain server-side requests (returns an HTML challenge page
// instead of JSON) unless they look like they came from a real browser hitting
// the real MeroShare site. These headers mirror apps/web/src/lib/proxy.ts,
// which already gets past it for the browser-facing login flow.
const BROWSER_LIKE_HEADERS: Record<string, string> = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Origin': 'https://meroshare.cdsc.com.np',
  'Referer': 'https://meroshare.cdsc.com.np/',
}

export class MeroShareClient {
  private readonly baseUrl: string
  private token: string | null = null
  private cookie: string | null = null

  constructor(baseUrl = 'https://backend.cdsc.com.np/api/meroShare') {
    this.baseUrl = baseUrl.replace(/\/+$/, '')
  }

  private captureCookies(res: Response): void {
    const getSetCookie = (res.headers as { getSetCookie?: () => string[] }).getSetCookie
    const raw = getSetCookie ? getSetCookie.call(res.headers) : res.headers.get('set-cookie') ? [res.headers.get('set-cookie')!] : []
    if (raw.length === 0) return
    const pairs = raw.map((c) => c.split(';')[0]?.trim()).filter((c): c is string => !!c)
    if (pairs.length > 0) {
      this.cookie = pairs.join('; ')
    }
  }

  async login(clientId: number, username: string, password: string): Promise<LoginResponse> {
    const url = `${this.baseUrl}${ENDPOINTS.AUTH}`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...BROWSER_LIKE_HEADERS,
      },
      body: JSON.stringify({ clientId, username, password }),
    })

    if (!res.ok) {
      const text = await res.text()
      throw new MeroShareError(
        `MeroShare API error: POST ${ENDPOINTS.AUTH} → ${res.status} ${res.statusText}`,
        res.status,
        text || undefined,
      )
    }

    this.captureCookies(res)

    const headerToken = res.headers.get('authorization') ?? res.headers.get('Authorization')
    if (headerToken) {
      this.token = headerToken
    }

    const body = await res.text()
    const data = body.length > 0 ? (JSON.parse(body) as Record<string, unknown>) : {}

    return {
      token: headerToken ?? (data.token as string) ?? '',
      isPasswordChanged: (data.passwordPolicyChanged as boolean) ?? false,
    }
  }

  /** Set or override the auth token directly (e.g. after restoring from a DB cache) */
  setToken(token: string): void {
    this.token = token
  }

  /** The raw token, suitable for persisting */
  getToken(): string | null {
    return this.token
  }

  /** Clear the stored token */
  logout(): void {
    this.token = null
  }

  /** List all Depository Participants — no authentication required */
  async getCapital(): Promise<DepositoryParticipant[]> {
    const result = await this.request<DepositoryParticipant[]>('GET', ENDPOINTS.CAPITAL, false)
    return Array.isArray(result) ? result : (result as Record<string, unknown>).data as DepositoryParticipant[] ?? []
  }

  /** Fetch all currently open IPO/FPO/RIGHT issues */
  async getCurrentIssues(): Promise<IPOIssue[]> {
    const result = await this.request<IPOIssue[]>('GET', ENDPOINTS.CURRENT_ISSUES)
    return Array.isArray(result) ? result : (result as Record<string, unknown>).data as IPOIssue[] ?? []
  }

  /** Fetch detail for a single issue by CDSC companyShareId */
  async getIssueDetail(companyShareId: number): Promise<IPOIssueDetail> {
    const result = await this.request<IPOIssueDetail>('GET', ENDPOINTS.ISSUE_DETAIL(companyShareId))
    return result as IPOIssueDetail
  }

  /** Fetch authenticated user's own profile & demat details (no path parameter) */
  async getOwnDetail(): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>('GET', ENDPOINTS.OWN_DETAIL)
  }

  /** Fetch authenticated user's bank mandate & CRN details */
  async getBankRequest(): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>('GET', ENDPOINTS.BANK_REQUEST)
  }

  /** Fetch portfolio holdings for the authenticated account */
  async getPortfolio(): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>('GET', ENDPOINTS.PORTFOLIO)
  }

  /** Submit an IPO application */
  async submitApplication(data: ApplicationRequest): Promise<void> {
    await this.request<void>('POST', ENDPOINTS.SUBMIT_APPLICATION, true, data as unknown as Record<string, unknown>)
  }

  /** Search application history for the authenticated account */
  async searchApplications(params: ApplicationSearchParams): Promise<ApplicationSearchResponse> {
    const result = await this.request<ApplicationSearchResponse>('POST', ENDPOINTS.SEARCH_APPLICATIONS, true, params as unknown as Record<string, unknown>)
    return { object: result.object ?? [], totalCount: result.totalCount ?? 0 }
  }

  /** Search migrated/older application history — same contract as searchApplications */
  async searchMigratedApplications(params: ApplicationSearchParams): Promise<ApplicationSearchResponse> {
    const result = await this.request<ApplicationSearchResponse>('POST', ENDPOINTS.SEARCH_MIGRATED_APPLICATIONS, true, params as unknown as Record<string, unknown>)
    return { object: result.object ?? [], totalCount: result.totalCount ?? 0 }
  }

  private async request<T>(
    method: string,
    path: string,
    auth = true,
    body?: Record<string, unknown>,
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...BROWSER_LIKE_HEADERS,
    }

    if (auth && this.token) {
      headers['Authorization'] = this.token
    }
    if (this.cookie) {
      headers['Cookie'] = this.cookie
    }

    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })

    this.captureCookies(res)

    if (!res.ok) {
      const text = await res.text()
      throw new MeroShareError(
        `MeroShare API error: ${method} ${path} → ${res.status} ${res.statusText}`,
        res.status,
        text || undefined,
      )
    }

    const responseText = await res.text()
    if (responseText.length === 0) {
      return undefined as unknown as T
    }

    try {
      return JSON.parse(responseText) as T
    } catch {
      throw new MeroShareError(
        `MeroShare API returned a non-JSON response for ${method} ${path} (HTTP ${res.status}) — the endpoint may have changed or is being blocked`,
        res.status,
        responseText.slice(0, 500),
      )
    }
  }
}
