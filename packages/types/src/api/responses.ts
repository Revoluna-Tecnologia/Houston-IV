export interface ApiResponse<T> {
  data: T
  message?: string
}

export interface ApiErrorResponse {
  statusCode: number
  message: string
  error?: string
  timestamp?: string
  path?: string
}

export interface ApiSuccessResponse {
  success: true
  message: string
}
