"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useApp, type LessonResult } from "@/components/providers/app-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { X, Check, ArrowRight, Sparkles, AlertCircle, Plus, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface WordDetail {
  word: string
  translation: string
  pronunciation?: string
}

interface Exercise {
  id: string
  type:
    | "translate-to-native"
    | "translate-to-turkish"
    | "word-bank"
    | "sentence-arrange"
    | "multiple-choice"
    | "fill-blank"
  question: string
  answer: string
  hint?: string
  options?: string[]
  context?: string
  wordBank?: string[]
  correctOrder?: string[]
  wordDetails?: WordDetail[]
}

type FeedbackState = {
  isCorrect: boolean
  message: string
  correctAnswer: string
} | null

export function LessonFlowScreen() {
  const router = useRouter()
  const { vocabulary, addVocabulary, setLessonResult, refreshData } = useApp()
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [userAnswer, setUserAnswer] = useState("")
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [selectedWords, setSelectedWords] = useState<string[]>([])
  const [feedback, setFeedback] = useState<FeedbackState>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<LessonResult["exercises"]>([])
  const [vocabularyUpdates, setVocabularyUpdates] = useState<{ turkish: string; isCorrect: boolean }[]>([])
  const [nativeLanguage, setNativeLanguage] = useState("English")

  const [wordDetailDialog, setWordDetailDialog] = useState<{
    open: boolean
    word: string
    translation: string
    pronunciation?: string
    isLoading?: boolean
  } | null>(null)

  const shuffledWordBank = useMemo(() => {
    if (!exercises[currentIndex]?.wordBank) return []
    const words = [...exercises[currentIndex].wordBank!]
    for (let i = words.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[words[i], words[j]] = [words[j], words[i]]
    }
    return words
  }, [exercises, currentIndex])

  useEffect(() => {
    generateExercises()
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

  const handleWordClick = async (word: string, isTurkish = true) => {
    if (!isTurkish) return

    const cleanWord = word.replace(/[.,!?;:'"()]/g, "").trim()
    if (!cleanWord) return

    const detail = currentExercise?.wordDetails?.find((w) => w.word.toLowerCase() === cleanWord.toLowerCase())

    if (detail) {
      setWordDetailDialog({
        open: true,
        word: detail.word,
        translation: detail.translation,
        pronunciation: detail.pronunciation,
      })
      return
    }

    const vocabItem = vocabulary.find((v) => v.turkish.toLowerCase() === cleanWord.toLowerCase())

    if (vocabItem) {
      setWordDetailDialog({
        open: true,
        word: vocabItem.turkish,
        translation: vocabItem.english,
      })
      return
    }

    setWordDetailDialog({
      open: true,
      word: cleanWord,
      translation: "",
      isLoading: true,
    })

    try {
      const response = await fetch("/api/translate-word", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: cleanWord, targetLanguage: nativeLanguage }),
      })

      if (response.ok) {
        const data = await response.json()
        setWordDetailDialog({
          open: true,
          word: cleanWord,
          translation: data.translation,
          pronunciation: data.pronunciation,
        })
      } else {
        setWordDetailDialog({
          open: true,
          word: cleanWord,
          translation: "Translation unavailable",
        })
      }
    } catch {
      setWordDetailDialog({
        open: true,
        word: cleanWord,
        translation: "Translation unavailable",
      })
    }
  }

  const handleWordSelect = (word: string) => {
    if (feedback) return

    if (selectedWords.includes(word)) {
      setSelectedWords(selectedWords.filter((w) => w !== word))
    } else {
      setSelectedWords([...selectedWords, word])
    }
  }

  const handleRemoveWord = (index: number) => {
    if (feedback) return
    setSelectedWords(selectedWords.filter((_, i) => i !== index))
  }

  const checkAnswer = () => {
    if (!currentExercise) return

    let userInput = ""
    let isCorrect = false

    if (currentExercise.type === "multiple-choice") {
      userInput = selectedOption || ""
    } else if (currentExercise.type === "word-bank" || currentExercise.type === "sentence-arrange") {
      userInput = selectedWords.join(" ")
    } else {
      userInput = userAnswer.trim()
    }

    if (!userInput) return

    const normalizedUser = userInput.toLowerCase().trim()
    const normalizedAnswer = currentExercise.answer.toLowerCase().trim()

    const isExactMatch = normalizedUser === normalizedAnswer
    const isCloseMatch = calculateSimilarity(normalizedUser, normalizedAnswer) > 0.85
    isCorrect = isExactMatch || isCloseMatch

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
      setSelectedWords([])
      setFeedback(null)
    } else {
      const totalCorrect = results.filter((r) => r.isCorrect).length + (feedback?.isCorrect ? 1 : 0)

      try {
        const userInput =
          currentExercise?.type === "multiple-choice"
            ? selectedOption
            : currentExercise?.type === "word-bank" || currentExercise?.type === "sentence-arrange"
              ? selectedWords.join(" ")
              : userAnswer

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
                userAnswer: userInput,
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
              userAnswer: userInput || "",
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
      <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-background">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
          <Sparkles className="w-10 h-10 text-primary animate-pulse" />
        </div>
        <p className="text-xl font-semibold text-foreground mb-2">Creating your lesson...</p>
        <p className="text-sm text-muted-foreground text-center max-w-xs">
          AI is crafting personalized exercises based on your vocabulary and level
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-background">
        <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
          <AlertCircle className="w-10 h-10 text-destructive" />
        </div>
        <p className="text-xl font-semibold text-foreground mb-2">Oops!</p>
        <p className="text-muted-foreground mb-6 max-w-xs">{error}</p>
        <div className="space-y-3 w-full max-w-xs">
          <Button onClick={generateExercises} className="w-full h-12">
            Try Again
          </Button>
          <Button variant="outline" onClick={() => router.push("/")} className="w-full h-12">
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
      case "translate-to-native":
        return `Translate to ${nativeLanguage}`
      case "translate-to-turkish":
        return "Translate to Turkish"
      case "word-bank":
        return "Build the translation"
      case "sentence-arrange":
        return "Arrange the sentence"
      case "multiple-choice":
        return "Choose the correct answer"
      case "fill-blank":
        return "Fill in the blank"
      default:
        return "Translate"
    }
  }

  const renderClickableWords = (text: string, isTurkish = true) => {
    const words = text.split(" ")
    return (
      <div className="flex flex-wrap gap-2 justify-center">
        {words.map((word, i) => (
          <button
            key={i}
            onClick={() => handleWordClick(word, isTurkish)}
            className={cn(
              "text-xl font-semibold transition-colors",
              isTurkish
                ? "text-foreground hover:text-primary underline decoration-dotted decoration-primary/40 hover:decoration-primary cursor-pointer"
                : "text-foreground cursor-default",
            )}
          >
            {word}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
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

      <div className="flex-1 px-6 py-6 flex flex-col">
        <p className="text-sm text-muted-foreground mb-2">{getExerciseTypeLabel(currentExercise.type)}</p>

        <Card className="p-6 mb-6 bg-muted/50 border-0">
          {currentExercise.type === "translate-to-native" ||
          currentExercise.type === "word-bank" ||
          currentExercise.type === "fill-blank" ||
          currentExercise.type === "multiple-choice" ? (
            renderClickableWords(currentExercise.question, true)
          ) : currentExercise.type === "sentence-arrange" || currentExercise.type === "translate-to-turkish" ? (
            renderClickableWords(currentExercise.question, false)
          ) : (
            <p className="text-xl font-semibold text-foreground text-center">{currentExercise.question}</p>
          )}
          {currentExercise.context && (
            <p className="text-sm text-muted-foreground text-center mt-2 italic">{currentExercise.context}</p>
          )}
        </Card>

        <div className="space-y-4 flex-1">
          {(currentExercise.type === "word-bank" || currentExercise.type === "sentence-arrange") &&
          currentExercise.wordBank ? (
            <div className="space-y-4">
              <Card className="p-4 min-h-[80px] bg-primary/5 border-2 border-dashed border-primary/30">
                {selectedWords.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedWords.map((word, i) => (
                      <button
                        key={i}
                        onClick={() => handleRemoveWord(i)}
                        disabled={!!feedback}
                        className={cn(
                          "px-4 py-2 rounded-lg font-medium transition-all",
                          feedback
                            ? feedback.isCorrect
                              ? "bg-green-500 text-white"
                              : "bg-red-500 text-white"
                            : "bg-primary text-primary-foreground hover:bg-primary/80",
                        )}
                      >
                        {word}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground">Tap words below to build your answer</p>
                )}
              </Card>

              <div className="flex flex-wrap gap-2 justify-center">
                {shuffledWordBank.map((word, i) => {
                  const isSelected = selectedWords.includes(word)
                  const isTurkishWord = currentExercise.type === "sentence-arrange"
                  return (
                    <button
                      key={`${word}-${i}`}
                      onClick={() => handleWordSelect(word)}
                      onContextMenu={(e) => {
                        e.preventDefault()
                        if (isTurkishWord) handleWordClick(word, true)
                      }}
                      disabled={!!feedback || isSelected}
                      className={cn(
                        "px-4 py-3 rounded-xl font-medium transition-all border-2 relative group",
                        isSelected
                          ? "opacity-30 border-transparent bg-muted"
                          : "border-muted hover:border-primary hover:bg-primary/5 bg-background",
                        feedback && "pointer-events-none",
                      )}
                    >
                      {word}
                      {isTurkishWord && !isSelected && !feedback && (
                        <span
                          className="absolute -top-1 -right-1 w-4 h-4 bg-primary/20 rounded-full text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleWordClick(word, true)
                          }}
                        >
                          ?
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>

              {currentExercise.type === "sentence-arrange" && (
                <p className="text-xs text-muted-foreground text-center">
                  Tap a word to select it. Long press or hover and click ? to see translation.
                </p>
              )}
            </div>
          ) : currentExercise.type === "multiple-choice" && currentExercise.options ? (
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

          {currentExercise.hint && !feedback && (
            <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
              <span className="font-medium">Hint:</span> {currentExercise.hint}
            </p>
          )}

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

        <div className="pt-6">
          {!feedback ? (
            <Button
              onClick={checkAnswer}
              className="w-full h-14 text-base font-medium rounded-xl"
              disabled={
                currentExercise.type === "multiple-choice"
                  ? !selectedOption
                  : currentExercise.type === "word-bank" || currentExercise.type === "sentence-arrange"
                    ? selectedWords.length === 0
                    : !userAnswer.trim()
              }
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

      <Dialog open={wordDetailDialog?.open || false} onOpenChange={(open) => !open && setWordDetailDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">{wordDetailDialog?.word}</DialogTitle>
            {wordDetailDialog?.pronunciation && (
              <p className="text-sm text-muted-foreground italic">{wordDetailDialog.pronunciation}</p>
            )}
          </DialogHeader>
          <div className="space-y-4">
            {wordDetailDialog?.isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Translating...</span>
              </div>
            ) : (
              <>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{nativeLanguage} Translation</p>
                  <p className="text-lg font-medium">{wordDetailDialog?.translation}</p>
                </div>
                <Button
                  onClick={async () => {
                    if (!wordDetailDialog) return
                    await addVocabulary(wordDetailDialog.word, wordDetailDialog.translation)
                    setWordDetailDialog(null)
                  }}
                  className="w-full"
                  variant="outline"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add to Vocabulary
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
