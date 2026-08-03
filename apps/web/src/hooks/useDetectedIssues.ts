import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function useDetectedIssues() {
  const { data, error, mutate } = useSWR('/api/ipos/detected', fetcher, {
    refreshInterval: 5 * 60 * 1000,
  })
  return {
    detected: data?.data ?? [],
    isLoading: !error && !data,
    isError: error,
    mutate,
  }
}
