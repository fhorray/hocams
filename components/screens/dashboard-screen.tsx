"use client"

import Link from "next/link"
import { useApp } from "@/components/providers/app-provider"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  GraduationCap,
  BookOpen,
  StickyNote,
  ChevronRight,
  Flame,
  Zap,
  Trophy,
  Target,
  TrendingUp,
  LogOut,
} from "lucide-react"

export function DashboardScreen() {
  const { vocabulary, notes, progress, user, signOut } = useApp()

  const canStartLesson = vocabulary.length > 0
  const currentStreak = progress?.current_streak || 0
  const xpPoints = progress?.xp_points || 0
  const level = progress?.level || 1
  const totalLessons = progress?.total_lessons || 0

  // Calculate XP progress to next level
  const xpForCurrentLevel = (level - 1) * 100
  const xpForNextLevel = level * 100
  const xpInCurrentLevel = xpPoints - xpForCurrentLevel
  const xpNeededForLevel = xpForNextLevel - xpForCurrentLevel
  const levelProgress = (xpInCurrentLevel / xpNeededForLevel) * 100

  // Get mastered words count
  const masteredWords = vocabulary.filter((v) => v.mastery_level >= 4).length
  const learningWords = vocabulary.filter((v) => v.mastery_level > 0 && v.mastery_level < 4).length

  return (
    <div className="px-6 py-6 space-y-6">
      {/* Header with User Info */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-muted-foreground text-sm">Welcome back</p>
          <h1 className="text-xl font-bold text-foreground">{user?.name || "Learner"}</h1>
        </div>
        <Button variant="ghost" size="icon" onClick={() => signOut()} className="text-muted-foreground">
          <LogOut className="w-5 h-5" />
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3 text-center bg-orange-50 dark:bg-orange-950/20 border-0">
          <Flame className="w-5 h-5 text-orange-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">{currentStreak}</p>
          <p className="text-xs text-muted-foreground">Day Streak</p>
        </Card>

        <Card className="p-3 text-center bg-yellow-50 dark:bg-yellow-950/20 border-0">
          <Zap className="w-5 h-5 text-yellow-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">{xpPoints}</p>
          <p className="text-xs text-muted-foreground">XP Points</p>
        </Card>

        <Card className="p-3 text-center bg-purple-50 dark:bg-purple-950/20 border-0">
          <Trophy className="w-5 h-5 text-purple-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">{totalLessons}</p>
          <p className="text-xs text-muted-foreground">Lessons</p>
        </Card>
      </div>

      {/* Level Progress */}
      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-sm font-bold text-primary-foreground">{level}</span>
            </div>
            <span className="font-medium text-foreground">Level {level}</span>
          </div>
          <span className="text-sm text-muted-foreground">
            {xpInCurrentLevel}/{xpNeededForLevel} XP
          </span>
        </div>
        <Progress value={levelProgress} className="h-2" />
      </Card>

      {/* Start Lesson CTA */}
      <Card className="p-5 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative">
          <div className="flex items-start justify-between mb-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <GraduationCap className="w-6 h-6" />
            </div>
            {currentStreak > 0 && (
              <div className="flex items-center gap-1 bg-white/20 px-2 py-1 rounded-full">
                <Flame className="w-4 h-4" />
                <span className="text-xs font-medium">{currentStreak} day streak!</span>
              </div>
            )}
          </div>
          <h2 className="text-lg font-semibold mb-1">{canStartLesson ? "Ready to Practice?" : "Start Learning"}</h2>
          <p className="text-sm opacity-90 mb-4">
            {canStartLesson
              ? "AI-powered exercises based on your vocabulary"
              : "Add vocabulary words to begin your journey"}
          </p>
          <Button
            asChild={canStartLesson}
            variant="secondary"
            className="w-full h-11 font-medium"
            disabled={!canStartLesson}
          >
            {canStartLesson ? (
              <Link href="/lesson">
                Begin Lesson
                <ChevronRight className="w-5 h-5 ml-2" />
              </Link>
            ) : (
              <span>Add Vocabulary First</span>
            )}
          </Button>
        </div>
      </Card>

      {/* Vocabulary & Notes Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Link href="/vocabulary">
          <Card className="p-4 hover:bg-muted/50 transition-colors h-full">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{vocabulary.length}</p>
            <p className="text-sm text-muted-foreground">Total Words</p>
            {masteredWords > 0 && (
              <div className="flex items-center gap-1 mt-2 text-xs text-green-600 dark:text-green-400">
                <Target className="w-3 h-3" />
                <span>{masteredWords} mastered</span>
              </div>
            )}
          </Card>
        </Link>

        <Link href="/notes">
          <Card className="p-4 hover:bg-muted/50 transition-colors h-full">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-950/30 flex items-center justify-center">
                <StickyNote className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{notes.length}</p>
            <p className="text-sm text-muted-foreground">Learning Notes</p>
            {notes.length > 0 && (
              <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                <TrendingUp className="w-3 h-3" />
                <span>Guiding your lessons</span>
              </div>
            )}
          </Card>
        </Link>
      </div>

      {/* Encouragement */}
      <Card className="p-4 bg-muted/30 border-0">
        <p className="text-sm text-muted-foreground leading-relaxed text-center">
          {vocabulary.length === 0
            ? "Start by adding Turkish words you want to learn. Your vocabulary shapes your personalized lessons."
            : notes.length === 0
              ? "Add notes about grammar or concepts you want to focus on. They help the AI create better lessons for you."
              : currentStreak === 0
                ? "Complete a lesson today to start building your streak!"
                : `Great job! You're on a ${currentStreak}-day streak. Keep the momentum going!`}
        </p>
      </Card>
    </div>
  )
}
