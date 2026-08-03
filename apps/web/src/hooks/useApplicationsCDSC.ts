import useSWR from 'swr'
import type { AllotmentRow } from '@/components/applications/AllotmentTable'

interface CDSCApplicationError {
  boid: string
  dpName: string
  category: 'CREDENTIAL_ERROR' | 'WAF_ERROR' | 'NETWORK_ERROR' | 'UNEXPECTED_ERROR'
  message: string
}

interface CDSCApplicationsData {
  applications: AllotmentRow[]
  errors: CDSCApplicationError[]
  accountCount: number
  successCount: number
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function useApplicationsCDSC() {
  const { data, error, mutate, isValidating } = useSWR('/api/applications/cdsc', fetcher, {
    refreshInterval: 5 * 60 * 1000,
    revalidateOnFocus: false,
  })

  const cdscData: CDSCApplicationsData | null = data?.data ?? null

  return {
    applications: cdscData?.applications ?? [],
    errors: cdscData?.errors ?? [],
    accountCount: cdscData?.accountCount ?? 0,
    successCount: cdscData?.successCount ?? 0,
    isLoading: !error && !data,
    isError: error,
    isValidating,
    mutate,
  }
}
