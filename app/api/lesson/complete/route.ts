import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { totalQuestions, correctAnswers, exercises, vocabularyUpdates } = await req.json()

    // Save lesson history
    await sql`
      INSERT INTO lesson_history (user_id, total_questions, correct_answers, exercises)
      VALUES (${user.id}, ${totalQuestions}, ${correctAnswers}, ${JSON.stringify(exercises)})
    `

    // Update vocabulary mastery levels
    for (const update of vocabularyUpdates || []) {
      if (update.isCorrect) {
        await sql`
          UPDATE vocabulary 
          SET 
            times_practiced = times_practiced + 1,
            times_correct = times_correct + 1,
            mastery_level = LEAST(mastery_level + 1, 5),
            last_practiced_at = NOW(),
            updated_at = NOW()
          WHERE turkish = ${update.turkish} AND user_id = ${user.id}
        `
      } else {
        await sql`
          UPDATE vocabulary 
          SET 
            times_practiced = times_practiced + 1,
            mastery_level = GREATEST(mastery_level - 1, 0),
            last_practiced_at = NOW(),
            updated_at = NOW()
          WHERE turkish = ${update.turkish} AND user_id = ${user.id}
        `
      }
    }

    // Calculate XP earned (10 per correct, 2 per wrong for trying)
    const xpEarned = correctAnswers * 10 + (totalQuestions - correctAnswers) * 2

    // Update user progress with streak logic
    const today = new Date().toISOString().split("T")[0]

    const [currentProgress] = await sql`
      SELECT * FROM user_progress WHERE user_id = ${user.id}
    `

    let newStreak = 1
    if (currentProgress) {
      const lastDate = currentProgress.last_lesson_date
      if (lastDate) {
        const lastDateStr = new Date(lastDate).toISOString().split("T")[0]
        const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0]

        if (lastDateStr === today) {
          // Same day, keep streak
          newStreak = currentProgress.current_streak
        } else if (lastDateStr === yesterday) {
          // Consecutive day, increment streak
          newStreak = currentProgress.current_streak + 1
        }
        // Otherwise reset to 1
      }
    }

    await sql`
      INSERT INTO user_progress (user_id, current_streak, longest_streak, total_lessons, xp_points, last_lesson_date, level)
      VALUES (
        ${user.id}, 
        ${newStreak}, 
        ${newStreak}, 
        1, 
        ${xpEarned}, 
        ${today},
        1
      )
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        current_streak = ${newStreak},
        longest_streak = GREATEST(user_progress.longest_streak, ${newStreak}),
        total_lessons = user_progress.total_lessons + 1,
        xp_points = user_progress.xp_points + ${xpEarned},
        level = FLOOR((user_progress.xp_points + ${xpEarned}) / 100) + 1,
        last_lesson_date = ${today},
        updated_at = NOW()
    `

    return NextResponse.json({
      success: true,
      xpEarned,
      newStreak,
    })
  } catch (error) {
    console.error("Error completing lesson:", error)
    return NextResponse.json({ error: "Failed to complete lesson" }, { status: 500 })
  }
}
