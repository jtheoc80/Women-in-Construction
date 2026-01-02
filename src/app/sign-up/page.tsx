import { SignUpClient } from './sign-up-client'

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

function firstParam(value: string | string[] | undefined): string | null {
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return value[0] ?? null
  return null
}

export default async function SignUpPage({ searchParams }: PageProps) {
  const params = await searchParams
  const next = firstParam(params?.next)

  return <SignUpClient next={next} />
}
