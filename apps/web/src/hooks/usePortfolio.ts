import useSWR from 'swr'

interface PortfolioHolding {
  companyShareId: number
  scrip: string
  companyName: string
  totalUnits: number
  previousClosingPrice: number
  valueAsOfClose: number
  totalValue: number
  accountBoid: string
  accountDpName: string
}

interface PortfolioAllotment {
  companyShareId: number
  scrip: string
  companyName: string
  appliedDate: string | null
  appliedKitta: number
  allottedKitta: number
  statusName: string
  accountBoid: string
  accountDpName: string
}

interface PortfolioError {
  boid: string
  dpName: string
  category: 'CREDENTIAL_ERROR' | 'WAF_ERROR' | 'NETWORK_ERROR' | 'UNEXPECTED_ERROR'
  message: string
}

interface PortfolioData {
  holdings: PortfolioHolding[]
  allotments: PortfolioAllotment[]
  errors: PortfolioError[]
  accountsFound: boolean
  accountCount: number
  successCount: number
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function usePortfolio() {
  const { data, error, mutate, isValidating } = useSWR('/api/portfolio/cdsc', fetcher, {
    refreshInterval: 5 * 60 * 1000,
    revalidateOnFocus: false,
  })

  const portfolioData: PortfolioData | null = data?.data ?? null

  return {
    data: portfolioData,
    isLoading: !error && !data,
    isError: error,
    isValidating,
    mutate,
  }
}
