import { redirect } from 'next/navigation'

/**
 * Home page redirects to /browse which contains the SiteSisters marketplace UI.
 */
export default function Home() {
  redirect('/browse')
}
