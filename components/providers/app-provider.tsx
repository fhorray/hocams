"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import useSWR, { mutate } from "swr"

export interface VocabularyItem {
  id: string
  turkish: string
  english: string
  mastery_level: number
  times_practiced: number
  times_correct: number
  last_practiced_at: string | null
  created_at: string
}

export interface Note {
  id: string
  content: string
  created_at: string
}

export interface UserProgress {
  current_streak: number
  longest_streak: number
  total_lessons: number
  total_words_learned: number
  xp_points: number
  level: number
  last_lesson_date: string | null
}

export interface LessonResult {
  totalQuestions: number
  correctAnswers: number
  xpEarned?: number
  newStreak?: number
  exercises: {
    question: string
    userAnswer: string
    correctAnswer: string
    isCorrect: boolean
    feedback: string
    type?: string
  }[]
}

export interface User {
  id: string
  email: string
  name: string | null
}

interface AppContextType {
  vocabulary: VocabularyItem[]
  notes: Note[]
  progress: UserProgress | null
  hasCompletedOnboarding: boolean
  currentLessonResult: LessonResult | null
  isLoading: boolean
  isAuthenticated: boolean
  user: User | null
  authLoading: boolean
  addVocabulary: (turkish: string, english: string) => Promise<void>
  removeVocabulary: (id: string) => Promise<void>
  addNote: (content: string) => Promise<void>
  removeNote: (id: string) => Promise<void>
  completeOnboarding: () => void
  setLessonResult: (result: LessonResult | null) => void
  refreshData: () => void
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signUp: (email: string, password: string, name?: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
}

const AppContext = createContext<AppContextType | null>(null)

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error("useApp must be used within AppProvider")
  }
  return context
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)

  const isAuthenticated = !!user

  // Fetch user on mount
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        setUser(data.user || null)
        setAuthLoading(false)
      })
      .catch(() => {
        setAuthLoading(false)
      })
  }, [])

  const { data: vocabulary = [], isLoading: vocabLoading } = useSWR(isAuthenticated ? "/api/vocabulary" : null, fetcher)

  const { data: notes = [], isLoading: notesLoading } = useSWR(isAuthenticated ? "/api/notes" : null, fetcher)

  const { data: progress, isLoading: progressLoading } = useSWR(isAuthenticated ? "/api/progress" : null, fetcher)

  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false)
  const [currentLessonResult, setCurrentLessonResult] = useState<LessonResult | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem("dilvane-onboarding")
    if (saved === "true") {
      setHasCompletedOnboarding(true)
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()

      if (!res.ok) {
        return { error: data.error || "Failed to sign in" }
      }

      setUser(data.user)
      return {}
    } catch (error) {
      return { error: "Something went wrong" }
    }
  }, [])

  const signUp = useCallback(async (email: string, password: string, name?: string) => {
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      })
      const data = await res.json()

      if (!res.ok) {
        return { error: data.error || "Failed to create account" }
      }

      setUser(data.user)
      return {}
    } catch (error) {
      return { error: "Something went wrong" }
    }
  }, [])

  const signOut = useCallback(async () => {
    await fetch("/api/auth/signout", { method: "POST" })
    setUser(null)
    setHasCompletedOnboarding(false)
    localStorage.removeItem("dilvane-onboarding")
  }, [])

  const addVocabulary = useCallback(async (turkish: string, english: string) => {
    await fetch("/api/vocabulary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ turkish, english }),
    })
    mutate("/api/vocabulary")
    mutate("/api/progress")
  }, [])

  const removeVocabulary = useCallback(async (id: string) => {
    await fetch(`/api/vocabulary?id=${id}`, { method: "DELETE" })
    mutate("/api/vocabulary")
  }, [])

  const addNote = useCallback(async (content: string) => {
    await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    })
    mutate("/api/notes")
  }, [])

  const removeNote = useCallback(async (id: string) => {
    await fetch(`/api/notes?id=${id}`, { method: "DELETE" })
    mutate("/api/notes")
  }, [])

  const completeOnboarding = useCallback(() => {
    setHasCompletedOnboarding(true)
    localStorage.setItem("dilvane-onboarding", "true")
  }, [])

  const setLessonResult = useCallback((result: LessonResult | null) => {
    setCurrentLessonResult(result)
  }, [])

  const refreshData = useCallback(() => {
    mutate("/api/vocabulary")
    mutate("/api/notes")
    mutate("/api/progress")
  }, [])

  const isLoading = vocabLoading || notesLoading || progressLoading

  return (
    <AppContext.Provider
      value={{
        vocabulary: Array.isArray(vocabulary) ? vocabulary : [],
        notes: Array.isArray(notes) ? notes : [],
        progress,
        hasCompletedOnboarding,
        currentLessonResult,
        isLoading,
        isAuthenticated,
        user,
        authLoading,
        addVocabulary,
        removeVocabulary,
        addNote,
        removeNote,
        completeOnboarding,
        setLessonResult,
        refreshData,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}
