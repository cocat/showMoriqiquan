import { redirect } from 'next/navigation'
import ClerkSignInClient from './sign-in-client'

export default function ClerkSignInPage() {
  if (process.env.NEXT_PUBLIC_SKIP_CLERK === 'true') {
    redirect('/sign-in')
  }

  return <ClerkSignInClient />
}
