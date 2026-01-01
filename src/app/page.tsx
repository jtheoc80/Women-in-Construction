import { redirect } from 'next/navigation'

/**
 * Home page redirects to /design which contains the SiteSisters marketplace UI.
 * 
 * DEPRECATED: The old "Women in Construction" purple gradient landing page
 * has been replaced. If you need to reference the old design, check git history.
 */
export default function Home() {
  redirect('/design')
}
