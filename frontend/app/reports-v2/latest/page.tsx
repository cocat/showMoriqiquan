'use client'

import { NewReportDetailView } from '@/app/components/NewReportDetailView'

export default function ReportsV2LatestPage() {
  return (
    <NewReportDetailView
      data={null}
      loading={false}
      errorMessage="暂无权限，可以登录后查看。"
      backHref="/reports"
      backLabel="返回历史简报"
      oppositeHref="/subscribe"
      oppositeLabel="查看会员权益"
    />
  )
}
