import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card'
import { SummaryCards } from './components/SummaryCards'
import { DailyTable } from './components/DailyTable'
import { MonthlyDaysTable } from './components/MonthlyDaysTable'
import { RealTimeStatus } from './components/RealTimeStatus'
import { AdvancedFilter } from './components/AdvancedFilter'

export default function ThemeLab() {
  const demoSummary = { present: 6, leave: 2, notReported: 1, total: 9 }
  const demoDaily = [
    { date: '2025-09-01', employee: 'เจ', status: 'present' as const },
    { date: '2025-09-01', employee: 'กอล์ฟ', status: 'present' as const },
    { date: '2025-09-01', employee: 'ปอง', status: 'leave' as const },
  ]
  const demoMonth = [
    { date: '2025-09-01', team: 'Dev', present: 6, leave: 2, notReported: 1 },
    { date: '2025-09-02', team: 'Dev', present: 7, leave: 1, notReported: 1 },
  ]

  return (
    <div className="min-h-screen p-4 space-y-6" data-export="true">
      <Card className="bg-[var(--panel-bg)]">
        <CardHeader>
          <CardTitle className="text-[var(--on-surface)]">Theme Lab • Light/Dark Audit</CardTitle>
        </CardHeader>
        <CardContent className="text-[var(--on-surface-muted)]">
          ใช้เพื่อตรวจ visual + a11y ของคอมโพเนนต์ในทั้ง Light/Dark
        </CardContent>
      </Card>

      <SummaryCards summary={demoSummary} isLoading={false} />

      <RealTimeStatus
        onRefreshData={() => {}}
        currentSummary={{ ...demoSummary }}
      />

      <AdvancedFilter onFilterChange={() => {}} onExport={() => {}} isVisible={true} />

      <DailyTable data={demoDaily} period="day" isLoading={false} />

      <MonthlyDaysTable data={demoMonth as any} isLoading={false} />
    </div>
  )
}

