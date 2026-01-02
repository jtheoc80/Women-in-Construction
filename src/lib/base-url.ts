/**
 * Helper to get the appropriate base URL for API calls.
 *
 * IMPORTANT: For client-side code, always use relative URLs like fetch("/api/listings").
 * This ensures requests work correctly on any domain (custom domain or vercel.app).
 * 
 * This helper is for server-side code that needs absolute URLs.
 *
 * @param path - The API path (e.g., "/api/listings")
 * @returns The path as-is for client, or full URL for server
 */
export function apiUrl(path: string): string {
  // Browser: always use relative URLs for same-origin requests
  // This is the recommended approach and works on all domains
  if (typeof window !== "undefined") {
    return path
  }

  // Server-side: For server components that need absolute URLs,
  // prefer using the NEXT_PUBLIC_SITE_URL env var or derive from request headers
  // in your specific context. This function returns relative path for safety.
  return path
}

/**
 * Build absolute URL from request headers for server-side code.
 * Use this in API routes or server components where you have access to headers.
 * 
 * @param path - The API path (e.g., "/api/listings")
 * @param headersGetter - Async function to get headers (e.g., from next/headers)
 * @returns Full URL including protocol and host
 */
export async function apiUrlFromHeaders(
  path: string,
  headersGetter: () => Promise<{ get: (name: string) => string | null }>
): Promise<string> {
  const h = await headersGetter()
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000"
  const proto = h.get("x-forwarded-proto") ?? "https"
  return `${proto}://${host}${path}`
}
