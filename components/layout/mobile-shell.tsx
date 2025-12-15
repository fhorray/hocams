"use client"

import { useEffect, useState, type ReactNode } from "react"
import { BottomNavigation } from "./bottom-navigation"
import { Monitor } from "lucide-react"

interface MobileShellProps {
  children: ReactNode
  hideNavigation?: boolean
}

export function MobileShell({ children, hideNavigation = false }: MobileShellProps) {
  const [isMobile, setIsMobile] = useState(true)
  const [isChecked, setIsChecked] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      // Check if it's a mobile device or mobile viewport
      const isMobileViewport = window.innerWidth < 768
      const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0
      setIsMobile(isMobileViewport || isTouchDevice)
    }

    checkMobile()
    setIsChecked(true)
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  if (!isChecked) {
    return null
  }

  if (!isMobile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-8">
        <div className="max-w-md text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto">
            <Monitor className="w-10 h-10 text-muted-foreground" />
          </div>
          <div className="space-y-3">
            <h1 className="text-2xl font-semibold text-foreground">Mobile Learning Only</h1>
            <p className="text-muted-foreground leading-relaxed">
              This app is designed for mobile learning only. Please open it on your phone or resize your browser to a
              mobile width for the best experience.
            </p>
          </div>
          <div className="pt-4">
            <p className="text-sm text-muted-foreground">
              Dilvane works best with one-handed, thumb-friendly navigation.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className={`flex-1 ${hideNavigation ? "" : "pb-20"}`}>{children}</main>
      {!hideNavigation && <BottomNavigation />}
    </div>
  )
}
