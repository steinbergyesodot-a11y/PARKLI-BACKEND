export interface ApiResponse<T>{
    success: boolean;
    data: T | null;
    error: string | null
}

export function responseWrapper<T>(
  success: boolean,
  data: T | null = null,
  error: string | null = null
): ApiResponse<T> {
  return { success, data, error };
}
