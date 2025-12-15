"use client"

import { useRouter } from "next/navigation"
import { useApp } from "@/components/providers/app-provider"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Check, X, Trophy, ArrowRight, RotateCcw, Flame, Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import confetti from "canvas-confetti"
import { useEffect } from "react"

export function LessonSummaryScreen() {
  const router = useRouter()
  const { currentLessonResult, setLessonResult } = useApp()

  useEffect(() => {
    if (currentLessonResult && currentLessonResult.correctAnswers / currentLessonResult.totalQuestions >= 0.7) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      })
    }
  }, [currentLessonResult])

  if (!currentLessonResult) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6">
        <p className="text-muted-foreground mb-4">No lesson results found</p>
        <Button onClick={() => router.push("/")}>Go Home</Button>
      </div>
    )
  }

  const { totalQuestions, correctAnswers, exercises, xpEarned, newStreak } = currentLessonResult
  const percentage = Math.round((correctAnswers / totalQuestions) * 100)

  const getMessage = () => {
    if (percentage >= 90) return "Outstanding work!"
    if (percentage >= 70) return "Great progress!"
    if (percentage >= 50) return "Good effort!"
    return "Keep practicing!"
  }

  const getEmoji = () => {
    if (percentage >= 90) return "🎉"
    if (percentage >= 70) return "🌟"
    if (percentage >= 50) return "💪"
    return "📚"
  }

  const handleDone = () => {
    setLessonResult(null)
    router.push("/")
  }

  const handlePracticeAgain = () => {
    setLessonResult(null)
    router.push("/lesson")
  }

  return (
    <div className="min-h-screen flex flex-col px-6 py-8">
      {/* Result Header */}
      <div className="text-center mb-6">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mx-auto mb-4 shadow-lg">
          <Trophy className="w-10 h-10 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-1">Lesson Complete!</h1>
        <p className="text-muted-foreground">
          {getMessage()} {getEmoji()}
        </p>
      </div>

      {/* Score Card */}
      <Card className="p-6 mb-4 text-center bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
        <p className="text-5xl font-bold mb-2">{percentage}%</p>
        <p className="text-sm opacity-90">
          {correctAnswers} of {totalQuestions} correct
        </p>
      </Card>

      {/* XP & Streak */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {xpEarned !== undefined && (
          <Card className="p-4 text-center bg-yellow-50 dark:bg-yellow-950/20 border-0">
            <Zap className="w-6 h-6 text-yellow-500 mx-auto mb-1" />
            <p className="text-xl font-bold text-foreground">+{xpEarned}</p>
            <p className="text-xs text-muted-foreground">XP Earned</p>
          </Card>
        )}
        {newStreak !== undefined && newStreak > 0 && (
          <Card className="p-4 text-center bg-orange-50 dark:bg-orange-950/20 border-0">
            <Flame className="w-6 h-6 text-orange-500 mx-auto mb-1" />
            <p className="text-xl font-bold text-foreground">{newStreak}</p>
            <p className="text-xs text-muted-foreground">Day Streak</p>
          </Card>
        )}
      </div>

      {/* Exercise Review */}
      <div className="flex-1 space-y-3 mb-6 overflow-y-auto">
        <h2 className="font-medium text-foreground sticky top-0 bg-background py-2">Review</h2>
        {exercises.map((exercise, index) => (
          <Card
            key={index}
            className={cn("p-4 border-0", exercise.isCorrect ? "bg-green-50 dark:bg-green-950/10" : "bg-muted/50")}
          >
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                  exercise.isCorrect ? "bg-green-500" : "bg-muted-foreground",
                )}
              >
                {exercise.isCorrect ? <Check className="w-4 h-4 text-white" /> : <X className="w-4 h-4 text-white" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground">{exercise.question}</p>
                <p className="text-sm text-muted-foreground">Your answer: {exercise.userAnswer}</p>
                {!exercise.isCorrect && (
                  <p className="text-sm text-primary mt-1 font-medium">Correct: {exercise.correctAnswer}</p>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <Button onClick={handlePracticeAgain} className="w-full h-14 text-base font-medium rounded-xl">
          Practice Again
          <RotateCcw className="w-5 h-5 ml-2" />
        </Button>
        <Button
          onClick={handleDone}
          variant="outline"
          className="w-full h-14 text-base font-medium rounded-xl bg-transparent"
        >
          Done
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  )
}
