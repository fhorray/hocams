"use client"

import { useState } from "react"
import { useApp } from "@/components/providers/app-provider"
import { Button } from "@/components/ui/button"
import { ChevronRight, BookOpen, Brain, Flame, Target } from "lucide-react"
import { cn } from "@/lib/utils"

const slides = [
  {
    icon: BookOpen,
    title: "Build Your Vocabulary",
    description:
      "Add Turkish words and expressions you want to learn. Your personal vocabulary becomes the foundation of every lesson.",
    color: "bg-blue-100 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400",
  },
  {
    icon: Brain,
    title: "AI-Powered Lessons",
    description:
      "Our AI creates personalized exercises based on your vocabulary and learning notes. Each lesson adapts to your progress.",
    color: "bg-purple-100 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400",
  },
  {
    icon: Target,
    title: "Track Your Mastery",
    description:
      "Words you get right level up. Words you struggle with come back more often. Watch your mastery grow over time.",
    color: "bg-green-100 dark:bg-green-950/30 text-green-600 dark:text-green-400",
  },
  {
    icon: Flame,
    title: "Build Your Streak",
    description:
      "Practice daily to build your streak. Earn XP, level up, and unlock achievements as you progress on your Turkish journey.",
    color: "bg-orange-100 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400",
  },
]

export function OnboardingScreen() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const { completeOnboarding } = useApp()

  const isLastSlide = currentSlide === slides.length - 1

  const handleNext = () => {
    if (isLastSlide) {
      completeOnboarding()
    } else {
      setCurrentSlide((prev) => prev + 1)
    }
  }

  const CurrentIcon = slides[currentSlide].icon

  return (
    <div className="min-h-screen flex flex-col px-6 py-12">
      {/* Logo */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-primary">Dilvane</h1>
        <p className="text-sm text-muted-foreground">Your Turkish Journey</p>
      </div>

      {/* Slide Content */}
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className={cn("w-24 h-24 rounded-2xl flex items-center justify-center mb-8", slides[currentSlide].color)}>
          <CurrentIcon className="w-12 h-12" />
        </div>

        <h2 className="text-xl font-semibold text-foreground mb-4">{slides[currentSlide].title}</h2>

        <p className="text-muted-foreground leading-relaxed max-w-xs">{slides[currentSlide].description}</p>
      </div>

      {/* Progress & Action */}
      <div className="space-y-6">
        {/* Progress Dots */}
        <div className="flex items-center justify-center gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={cn(
                "h-2 rounded-full transition-all",
                index === currentSlide ? "w-8 bg-primary" : "w-2 bg-muted-foreground/30",
              )}
            />
          ))}
        </div>

        {/* Action Button */}
        <Button onClick={handleNext} className="w-full h-14 text-base font-medium rounded-xl">
          {isLastSlide ? "Start Learning" : "Continue"}
          <ChevronRight className="w-5 h-5 ml-2" />
        </Button>

        {/* Skip option */}
        {!isLastSlide && (
          <button
            onClick={completeOnboarding}
            className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip intro
          </button>
        )}
      </div>
    </div>
  )
}
