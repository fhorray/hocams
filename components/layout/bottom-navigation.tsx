"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, BookOpen, StickyNote, User } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/vocabulary", icon: BookOpen, label: "Words" },
  { href: "/notes", icon: StickyNote, label: "Notes" },
  { href: "/profile", icon: User, label: "Profile" },
]

export function BottomNavigation() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border safe-bottom z-50">
      <div className="flex items-center justify-around h-16">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || (href !== "/" && pathname.startsWith(href))

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full gap-1 transition-colors",
                "active:bg-muted/50 touch-manipulation",
                isActive ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-xs font-medium">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
