import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function useIPOs() {
  const { data, error, mutate } = useSWR('/api/ipos', fetcher)
  return {
    ipos: data?.data ?? [],
    isLoading: !error && !data,
    isError: error,
    mutate,
  }
}
