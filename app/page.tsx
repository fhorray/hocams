"use client"

import { useApp } from "@/components/providers/app-provider"
import { MobileShell } from "@/components/layout/mobile-shell"
import { OnboardingScreen } from "@/components/screens/onboarding-screen"
import { DashboardScreen } from "@/components/screens/dashboard-screen"
import { AuthScreen } from "@/components/screens/auth-screen"
import { Loader2 } from "lucide-react"

export default function HomePage() {
  const { hasCompletedOnboarding, isAuthenticated, isLoading, authLoading } = useApp()

  // Show loading while checking auth status
  if (authLoading) {
    return (
      <MobileShell hideNavigation>
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
            <p className="mt-4 text-muted-foreground">Loading...</p>
          </div>
        </div>
      </MobileShell>
    )
  }

  if (!isAuthenticated) {
    return (
      <MobileShell hideNavigation>
        <AuthScreen />
      </MobileShell>
    )
  }

  if (isLoading) {
    return (
      <MobileShell hideNavigation>
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MobileShell>
    )
  }

  if (!hasCompletedOnboarding) {
    return (
      <MobileShell hideNavigation>
        <OnboardingScreen />
      </MobileShell>
    )
  }

  return (
    <MobileShell>
      <DashboardScreen />
    </MobileShell>
  )
}
