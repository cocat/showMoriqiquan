import { redirect } from 'next/navigation'

export default async function LatestReportRedirect() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

  try {
    const res = await fetch(`${API_URL}/api/reports/latest/summary`, {
      cache: 'no-store',
    })
    if (res.ok) {
      const data = await res.json()
      if (data?.report_date) {
        redirect(`/reports/${data.report_date}`)
      }
    }
  } catch {
    // network error — fall through to reports list
  }

  redirect('/reports')
}
