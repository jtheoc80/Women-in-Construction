import { NextResponse } from 'next/server'
import { getJobsites, type Jobsite } from '@/lib/supabase'

// Mock jobsites for demo mode
const mockJobsites: Jobsite[] = [
  {
    id: 'mock-tsmc',
    name: 'TSMC Arizona',
    city: 'Phoenix',
    state: 'AZ',
    slug: 'tsmc-arizona',
    description: 'Taiwan Semiconductor Manufacturing Company fab facility.',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'mock-intel-az',
    name: 'Intel Ocotillo',
    city: 'Chandler',
    state: 'AZ',
    slug: 'intel-ocotillo',
    description: 'Intel semiconductor manufacturing campus.',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'mock-samsung',
    name: 'Samsung Taylor',
    city: 'Taylor',
    state: 'TX',
    slug: 'samsung-taylor',
    description: 'Samsung semiconductor fab.',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'mock-intel-oh',
    name: 'Intel Ohio',
    city: 'New Albany',
    state: 'OH',
    slug: 'intel-ohio',
    description: 'Intel mega-site semiconductor fab.',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'mock-micron-sy',
    name: 'Micron Syracuse',
    city: 'Clay',
    state: 'NY',
    slug: 'micron-syracuse',
    description: 'Micron memory chip fab facility.',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'mock-micron-bo',
    name: 'Micron Boise',
    city: 'Boise',
    state: 'ID',
    slug: 'micron-boise',
    description: 'Micron Technology headquarters and fab.',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'mock-tesla',
    name: 'Tesla Gigafactory Texas',
    city: 'Austin',
    state: 'TX',
    slug: 'tesla-gigafactory-texas',
    description: 'Tesla vehicle and battery manufacturing.',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'mock-aws',
    name: 'AWS Data Center Ashburn',
    city: 'Ashburn',
    state: 'VA',
    slug: 'aws-ashburn',
    description: 'Amazon Web Services data center campus.',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

export async function GET() {
  try {
    // If Supabase not configured, return mock data
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json(mockJobsites)
    }

    const jobsites = await getJobsites()
    return NextResponse.json(jobsites)
  } catch (error) {
    console.error('Jobsites fetch error:', error)
    // Return mock data on error
    return NextResponse.json(mockJobsites)
  }
}
