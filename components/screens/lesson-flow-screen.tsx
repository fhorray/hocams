"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useApp, type LessonResult } from "@/components/providers/app-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { X, Check, ArrowRight, Sparkles, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface Exercise {
  id: string
  type:
    | "turkish-to-native"
    | "native-to-turkish"
    | "turkish-to-english"
    | "english-to-turkish"
    | "fill-in-blank"
    | "multiple-choice"
    | "sentence-building"
  question: string
  answer: string
  hint?: string
  options?: string[]
  context?: string
}

type FeedbackState = {
  isCorrect: boolean
  message: string
  correctAnswer: string
} | null

export function LessonFlowScreen() {
  const router = useRouter()
  const { vocabulary, setLessonResult, refreshData } = useApp()
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [userAnswer, setUserAnswer] = useState("")
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<FeedbackState>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<LessonResult["exercises"]>([])
  const [vocabularyUpdates, setVocabularyUpdates] = useState<{ turkish: string; isCorrect: boolean }[]>([])
  const [nativeLanguage, setNativeLanguage] = useState("English")

  useEffect(() => {
    generateExercises()
    // Fetch user's native language setting
    fetch("/api/user/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.native_language) {
          setNativeLanguage(data.native_language)
        }
      })
      .catch(console.error)
  }, [])

  const generateExercises = async () => {
    setIsLoading(true)
    setError(null)

    if (vocabulary.length === 0) {
      setExercises([])
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("/api/lesson/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          setError("Please sign in to start a lesson")
        } else {
          setError(data.error || "Failed to generate lesson")
        }
        return
      }

      setExercises(data.exercises || [])
    } catch (err) {
      console.error("Error generating exercises:", err)
      setError("Failed to connect. Please check your connection and try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const currentExercise = exercises[currentIndex]
  const progress = exercises.length > 0 ? (currentIndex / exercises.length) * 100 : 0

  const checkAnswer = () => {
    if (!currentExercise) return

    const userInput = currentExercise.type === "multiple-choice" ? selectedOption : userAnswer.trim()
    if (!userInput) return

    const normalizedUser = userInput.toLowerCase().trim()
    const normalizedAnswer = currentExercise.answer.toLowerCase().trim()

    const isExactMatch = normalizedUser === normalizedAnswer
    const isCloseMatch = calculateSimilarity(normalizedUser, normalizedAnswer) > 0.8
    const isCorrect = isExactMatch || isCloseMatch

    let message = ""
    if (isExactMatch) {
      message = "Perfect! Exactly right."
    } else if (isCloseMatch) {
      message = `Close enough! The exact answer is "${currentExercise.answer}".`
    } else {
      message = `Not quite. The correct answer is "${currentExercise.answer}".`
    }

    setFeedback({
      isCorrect,
      message,
      correctAnswer: currentExercise.answer,
    })

    setResults((prev) => [
      ...prev,
      {
        question: currentExercise.question,
        userAnswer: userInput,
        correctAnswer: currentExercise.answer,
        isCorrect,
        feedback: message,
        type: currentExercise.type,
      },
    ])

    // Track vocabulary update for mastery
    const vocabWord = vocabulary.find(
      (v) =>
        v.turkish.toLowerCase() === currentExercise.question.toLowerCase() ||
        v.turkish.toLowerCase() === currentExercise.answer.toLowerCase(),
    )
    if (vocabWord) {
      setVocabularyUpdates((prev) => [...prev, { turkish: vocabWord.turkish, isCorrect }])
    }
  }

  const handleNext = async () => {
    if (currentIndex < exercises.length - 1) {
      setCurrentIndex((prev) => prev + 1)
      setUserAnswer("")
      setSelectedOption(null)
      setFeedback(null)
    } else {
      // Lesson complete - save results
      const totalCorrect = results.filter((r) => r.isCorrect).length + (feedback?.isCorrect ? 1 : 0)

      try {
        const response = await fetch("/api/lesson/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            totalQuestions: exercises.length,
            correctAnswers: totalCorrect,
            exercises: [
              ...results,
              feedback && {
                question: currentExercise?.question,
                userAnswer: currentExercise?.type === "multiple-choice" ? selectedOption : userAnswer,
                correctAnswer: currentExercise?.answer,
                isCorrect: feedback.isCorrect,
                feedback: feedback.message,
              },
            ].filter(Boolean),
            vocabularyUpdates,
          }),
        })

        const data = await response.json()

        const lessonResult: LessonResult = {
          totalQuestions: exercises.length,
          correctAnswers: totalCorrect,
          xpEarned: data.xpEarned,
          newStreak: data.newStreak,
          exercises: [
            ...results,
            {
              question: currentExercise?.question || "",
              userAnswer: currentExercise?.type === "multiple-choice" ? selectedOption || "" : userAnswer,
              correctAnswer: currentExercise?.answer || "",
              isCorrect: feedback?.isCorrect || false,
              feedback: feedback?.message || "",
            },
          ],
        }

        setLessonResult(lessonResult)
        refreshData()
        router.push("/lesson/summary")
      } catch (err) {
        console.error("Error saving lesson:", err)
        router.push("/lesson/summary")
      }
    }
  }

  const handleClose = () => {
    router.push("/")
  }

  function calculateSimilarity(a: string, b: string): number {
    if (a === b) return 1
    const longer = a.length > b.length ? a : b
    const shorter = a.length > b.length ? b : a
    if (longer.length === 0) return 1
    const editDistance = levenshteinDistance(longer, shorter)
    return (longer.length - editDistance) / longer.length
  }

  function levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = []
    for (let i = 0; i <= b.length; i++) matrix[i] = [i]
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
        }
      }
    }
    return matrix[b.length][a.length]
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Sparkles className="w-8 h-8 text-primary animate-pulse" />
        </div>
        <p className="text-lg font-medium text-foreground mb-2">Creating your lesson...</p>
        <p className="text-sm text-muted-foreground text-center">
          Our AI is crafting personalized exercises based on your vocabulary and goals
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-destructive" />
        </div>
        <p className="text-lg font-medium text-foreground mb-2">Oops!</p>
        <p className="text-muted-foreground mb-6">{error}</p>
        <div className="space-y-3 w-full max-w-xs">
          <Button onClick={generateExercises} className="w-full">
            Try Again
          </Button>
          <Button variant="outline" onClick={() => router.push("/")} className="w-full">
            Go Home
          </Button>
        </div>
      </div>
    )
  }

  if (!currentExercise) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <p className="text-lg font-medium text-foreground mb-2">No vocabulary yet</p>
        <p className="text-muted-foreground mb-6">Add some words to your vocabulary first to start a lesson.</p>
        <Button onClick={() => router.push("/vocabulary")}>Add Vocabulary</Button>
      </div>
    )
  }

  const getExerciseTypeLabel = (type: string) => {
    switch (type) {
      case "turkish-to-english":
      case "turkish-to-native":
        return `Translate to ${nativeLanguage}`
      case "english-to-turkish":
      case "native-to-turkish":
        return "Translate to Turkish"
      case "fill-in-blank":
        return "Fill in the blank"
      case "multiple-choice":
        return "Choose the correct answer"
      case "sentence-building":
        return "Build the sentence"
      default:
        return "Translate"
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 space-y-3">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="w-6 h-6" />
          </Button>
          <span className="text-sm text-muted-foreground">
            {currentIndex + 1} of {exercises.length}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Exercise Content */}
      <div className="flex-1 px-6 py-6 flex flex-col">
        {/* Question Type */}
        <p className="text-sm text-muted-foreground mb-2">{getExerciseTypeLabel(currentExercise.type)}</p>

        {/* Question */}
        <Card className="p-6 mb-6 bg-muted/50 border-0">
          <p className="text-xl font-semibold text-foreground text-center">{currentExercise.question}</p>
          {currentExercise.context && (
            <p className="text-sm text-muted-foreground text-center mt-2 italic">{currentExercise.context}</p>
          )}
        </Card>

        {/* Answer Input */}
        <div className="space-y-4 flex-1">
          {currentExercise.type === "multiple-choice" && currentExercise.options ? (
            <div className="grid grid-cols-1 gap-3">
              {currentExercise.options.map((option, i) => (
                <button
                  key={i}
                  onClick={() => !feedback && setSelectedOption(option)}
                  disabled={!!feedback}
                  className={cn(
                    "p-4 rounded-xl border-2 text-left transition-all",
                    selectedOption === option
                      ? feedback
                        ? feedback.isCorrect
                          ? "border-green-500 bg-green-50 dark:bg-green-950/20"
                          : option === currentExercise.answer
                            ? "border-green-500 bg-green-50 dark:bg-green-950/20"
                            : "border-red-500 bg-red-50 dark:bg-red-950/20"
                        : "border-primary bg-primary/5"
                      : feedback && option === currentExercise.answer
                        ? "border-green-500 bg-green-50 dark:bg-green-950/20"
                        : "border-muted hover:border-muted-foreground/50",
                  )}
                >
                  <span className="font-medium">{option}</span>
                </button>
              ))}
            </div>
          ) : (
            <Input
              placeholder="Type your answer..."
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !feedback) {
                  checkAnswer()
                }
              }}
              className="h-14 text-lg"
              disabled={!!feedback}
            />
          )}

          {/* Hint */}
          {currentExercise.hint && !feedback && (
            <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
              <span className="font-medium">Hint:</span> {currentExercise.hint}
            </p>
          )}

          {/* Feedback */}
          {feedback && (
            <Card
              className={cn(
                "p-4 border-0",
                feedback.isCorrect ? "bg-green-50 dark:bg-green-950/20" : "bg-amber-50 dark:bg-amber-950/20",
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                    feedback.isCorrect ? "bg-green-500" : "bg-amber-500",
                  )}
                >
                  <Check className="w-5 h-5 text-white" />
                </div>
                <p className="text-sm text-foreground leading-relaxed">{feedback.message}</p>
              </div>
            </Card>
          )}
        </div>

        {/* Action Button */}
        <div className="pt-6">
          {!feedback ? (
            <Button
              onClick={checkAnswer}
              className="w-full h-14 text-base font-medium rounded-xl"
              disabled={currentExercise.type === "multiple-choice" ? !selectedOption : !userAnswer.trim()}
            >
              Check Answer
            </Button>
          ) : (
            <Button onClick={handleNext} className="w-full h-14 text-base font-medium rounded-xl">
              {currentIndex < exercises.length - 1 ? "Continue" : "See Results"}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
