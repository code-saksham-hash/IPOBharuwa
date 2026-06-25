import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function useApplications(params?: { status?: string; page?: number; size?: number }) {
  const search = new URLSearchParams()
  if (params?.status) search.set('status', params.status)
  if (params?.page !== undefined) search.set('page', String(params.page))
  if (params?.size !== undefined) search.set('size', String(params.size))

  const query = search.toString()
  const url = `/api/applications${query ? `?${query}` : ''}`

  const { data, error, mutate } = useSWR(url, fetcher)
  return {
    applications: data?.data?.applications ?? [],
    totalCount: data?.data?.totalCount ?? 0,
    isLoading: !error && !data,
    isError: error,
    mutate,
  }
}
