'use client'

import Script from 'next/script'
import { usePathname } from 'next/navigation'
import { useEffect, Suspense } from 'react'

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-BSBP420ZNB'

function AnalyticsPageView() {
  const pathname = usePathname()

  useEffect(() => {
    const w = window as unknown as { gtag?: (a: string, b: string, c?: object) => void }
    if (pathname && GA_ID && w.gtag) {
      w.gtag('config', GA_ID, { page_path: pathname })
    }
  }, [pathname])

  return null
}

export default function GoogleAnalytics() {
  if (!GA_ID) return null

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}');
        `}
      </Script>
      <Suspense fallback={null}>
        <AnalyticsPageView />
      </Suspense>
    </>
  )
}
