/**
 * Standard API response envelope returned by every backend endpoint.
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  count?: number;
}
