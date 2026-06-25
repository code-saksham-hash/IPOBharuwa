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
}

export interface ApplicationSearchResponse {
  object: unknown[]
  totalCount: number
}

export class MeroShareClient {
  private readonly baseUrl: string
  private token: string | null = null

  constructor(baseUrl = 'https://backend.cdsc.com.np/api/meroShare') {
    this.baseUrl = baseUrl.replace(/\/+$/, '')
  }

  async login(clientId: number, username: string, password: string): Promise<LoginResponse> {
    const url = `${this.baseUrl}${ENDPOINTS.AUTH}`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
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
