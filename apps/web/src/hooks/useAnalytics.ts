import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export interface AnalyticsMonthlyRow {
  month: string
  applications: number
  allotments: number
}

export interface AnalyticsTotals {
  totalApplied: number
  totalAllotted: number
  totalPending: number
  totalFailed: number
  successRate: number
}

export interface AnalyticsData {
  monthlyData: AnalyticsMonthlyRow[]
  totals: AnalyticsTotals
}

export function useAnalytics() {
  const { data, error, mutate } = useSWR('/api/analytics', fetcher, {
    refreshInterval: 5 * 60 * 1000,
    revalidateOnFocus: false,
  })

  return {
    data: (data?.data as AnalyticsData) ?? null,
    isLoading: !error && !data,
    isError: error,
    mutate,
  }
}
