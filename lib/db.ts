import { neon } from "@neondatabase/serverless"

export const sql = neon(process.env.DATABASE_URL!)

export type VocabularyRow = {
  id: string
  user_id: string
  turkish: string
  english: string
  mastery_level: number
  times_practiced: number
  times_correct: number
  last_practiced_at: string | null
  created_at: string
  updated_at: string
}

export type NoteRow = {
  id: string
  user_id: string
  content: string
  created_at: string
  updated_at: string
}

export type LessonHistoryRow = {
  id: string
  user_id: string
  total_questions: number
  correct_answers: number
  exercises: object
  completed_at: string
}

export type UserProgressRow = {
  user_id: string
  current_streak: number
  longest_streak: number
  total_lessons: number
  total_words_learned: number
  last_lesson_date: string | null
  xp_points: number
  level: number
  created_at: string
  updated_at: string
}
