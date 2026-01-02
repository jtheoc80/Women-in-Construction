/**
 * Helper to get the appropriate base URL for API calls.
 *
 * - Client-side (browser): Always returns a relative path for same-origin requests
 * - Server-side: Builds an absolute URL using request headers (x-forwarded-host/proto)
 *
 * @param path - The API path (e.g., "/api/listings")
 * @returns The path as-is for client, or full URL for server
 */
export function apiUrl(path: string): string {
  // Browser: always use relative URLs for same-origin requests
  if (typeof window !== "undefined") {
    return path
  }

  // Server-side: build absolute URL from request headers
  // Using dynamic require to avoid bundling next/headers in client code
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { headers } = require("next/headers")
  const h = headers()
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000"
  const proto = h.get("x-forwarded-proto") ?? "https"
  return `${proto}://${host}${path}`
}
