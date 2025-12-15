"use client"

import { MobileShell } from "@/components/layout/mobile-shell"
import { LessonSummaryScreen } from "@/components/screens/lesson-summary-screen"

export default function LessonSummaryPage() {
  return (
    <MobileShell hideNavigation>
      <LessonSummaryScreen />
    </MobileShell>
  )
}
