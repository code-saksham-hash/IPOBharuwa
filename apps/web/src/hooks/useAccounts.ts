import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function useAccounts() {
  const { data, error, mutate } = useSWR('/api/accounts', fetcher)
  return {
    accounts: data?.data ?? [],
    isLoading: !error && !data,
    isError: error,
    mutate,
  }
}
