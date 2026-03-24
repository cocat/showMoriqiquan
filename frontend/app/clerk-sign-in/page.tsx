import dynamic from 'next/dynamic'

export const dynamic = 'force-dynamic'

const ClerkSignInClient = dynamic(() => import('./sign-in-client'), {
  ssr: false,
})

export default function ClerkSignInPage() {
  return (
    <ClerkSignInClient />
  )
}
