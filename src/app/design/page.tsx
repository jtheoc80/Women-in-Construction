import { notFound } from 'next/navigation'
import DesignClient from './design-client'

/**
 * Design page - development only.
 * 
 * This page is used for design preview and testing.
 * In production, it returns a 404.
 */
export default function DesignPage() {
  // Only allow access in development
  if (process.env.NODE_ENV !== 'development') {
    notFound()
  }

  return <DesignClient />
}
