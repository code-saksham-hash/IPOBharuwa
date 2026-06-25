export interface ApiResponse<T> {
  data: T | null
  error: string | null
}

export interface PaginatedResponse<T> {
  applications: T[]
  totalCount: number
  page: number
  size: number
}
