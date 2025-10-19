/**
 * Get the backend URL for API calls
 * In production, this should be configured via environment variables
 */
export const getBackendUrl = (): string => {
  // In development, use localhost:9000
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:9000'
  }
  
  // In production, you should set this via environment variables
  // For now, defaulting to localhost:9000
  return process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'http://localhost:9000'
}

/**
 * Get the publishable API key for store API calls
 */
export const getPublishableApiKey = (): string => {
  return process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ''
}
