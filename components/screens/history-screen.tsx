"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Calendar, Check, X, Loader2 } from "lucide-react"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface LessonHistory {
  id: string
  total_questions: number
  correct_answers: number
  exercises: {
    question: string
    userAnswer: string
    correctAnswer: string
    isCorrect: boolean
  }[]
  completed_at: string
}

export function HistoryScreen() {
  const router = useRouter()
  const { data: history, isLoading } = useSWR<LessonHistory[]>("/api/lesson/history", fetcher)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-foreground">Lesson History</h1>
          <p className="text-sm text-muted-foreground">Your recent lessons</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : !history || history.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-foreground font-medium mb-2">No lessons yet</p>
          <p className="text-sm text-muted-foreground mb-6">Complete your first lesson to see it here</p>
          <Button onClick={() => router.push("/lesson")}>Start a Lesson</Button>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((lesson) => {
            const percentage = Math.round((lesson.correct_answers / lesson.total_questions) * 100)
            return (
              <Card key={lesson.id} className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    {formatDate(lesson.completed_at)}
                  </div>
                  <div
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      percentage >= 70
                        ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400"
                        : percentage >= 50
                          ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400"
                          : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400"
                    }`}
                  >
                    {percentage}%
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                    <Check className="w-4 h-4" />
                    <span className="text-sm font-medium">{lesson.correct_answers} correct</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <X className="w-4 h-4" />
                    <span className="text-sm">{lesson.total_questions - lesson.correct_answers} wrong</span>
                  </div>
                </div>

                {/* Preview of exercises */}
                <div className="flex flex-wrap gap-1">
                  {lesson.exercises.slice(0, 8).map((ex, i) => (
                    <div
                      key={i}
                      className={`w-3 h-3 rounded-full ${ex.isCorrect ? "bg-green-500" : "bg-red-400"}`}
                      title={ex.question}
                    />
                  ))}
                  {lesson.exercises.length > 8 && (
                    <span className="text-xs text-muted-foreground ml-1">+{lesson.exercises.length - 8}</span>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
