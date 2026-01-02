import { SignupClient } from './signup-client'

type PageProps = {
  searchParams?: Record<string, string | string[] | undefined>
}

function firstParam(value: string | string[] | undefined): string | null {
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return value[0] ?? null
  return null
}

export default function SignupPage({ searchParams }: PageProps) {
  const next = firstParam(searchParams?.next)
  const invite = firstParam(searchParams?.invite)

  return <SignupClient next={next} invite={invite} />
}

