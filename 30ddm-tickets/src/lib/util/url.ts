/**
 * Get the base URL for the storefront based on environment variables
 * This ensures QR codes and validation URLs work correctly in all environments
 */
export function getStorefrontBaseUrl(): string {
  // Priority order for determining the base URL:
  // 1. STORE_URL - explicitly set storefront URL
  // 2. MEDUSA_BACKEND_URL - backend URL (might be same as frontend)
  // 3. NEXT_PUBLIC_MEDUSA_BACKEND_URL - public backend URL
  // 4. Default localhost for development
  
  const storeUrl = process.env.STORE_URL
  const backendUrl = process.env.MEDUSA_BACKEND_URL
  const publicBackendUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL
  
  // If STORE_URL is set, use it
  if (storeUrl) {
    return storeUrl
  }
  
  // If MEDUSA_BACKEND_URL is set, try to convert it to frontend URL
  if (backendUrl) {
    // If it's localhost, assume frontend is on port 8000
    if (backendUrl.includes('localhost:9000')) {
      return 'http://localhost:8000'
    }
    
    // For production, assume frontend is on same domain but different port/path
    // You might need to adjust this based on your deployment setup
    const url = new URL(backendUrl)
    if (url.port === '9000') {
      url.port = '8000'
    }
    return url.toString().replace(/\/$/, '') // Remove trailing slash
  }
  
  // If NEXT_PUBLIC_MEDUSA_BACKEND_URL is set, use similar logic
  if (publicBackendUrl) {
    if (publicBackendUrl.includes('localhost:9000')) {
      return 'http://localhost:8000'
    }
    
    const url = new URL(publicBackendUrl)
    if (url.port === '9000') {
      url.port = '8000'
    }
    return url.toString().replace(/\/$/, '')
  }
  
  // Default fallback
  return 'http://localhost:8000'
}

/**
 * Get the validation URL for a ticket
 */
export function getTicketValidationUrl(ticketId: string, countryCode: string = 'dk'): string {
  const baseUrl = getStorefrontBaseUrl()
  return `${baseUrl}/${countryCode}/tickets/validate/${ticketId}`
}
