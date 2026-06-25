import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function useNotifications(limit = 50) {
  const { data, error, mutate } = useSWR(`/api/notifications?limit=${limit}`, fetcher)

  const notifications = data?.data ?? []
  const unreadCount = notifications.filter((n: { isRead: boolean }) => !n.isRead).length

  return {
    notifications,
    unreadCount,
    isLoading: !error && !data,
    isError: error,
    mutate,
  }
}
