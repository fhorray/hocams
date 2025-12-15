"use client"

import { MobileShell } from "@/components/layout/mobile-shell"
import { LessonFlowScreen } from "@/components/screens/lesson-flow-screen"

export default function LessonPage() {
  return (
    <MobileShell hideNavigation>
      <LessonFlowScreen />
    </MobileShell>
  )
}
