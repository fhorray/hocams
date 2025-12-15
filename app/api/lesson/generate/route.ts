import { type NextRequest, NextResponse } from "next/server"
import { generateObject } from "ai"
import { z } from "zod"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { openai } from "@ai-sdk/openai"

const exerciseSchema = z.object({
  exercises: z.array(
    z.object({
      id: z.string(),
      type: z.enum(["turkish-to-native", "native-to-turkish", "fill-in-blank", "multiple-choice", "sentence-building"]),
      question: z.string(),
      answer: z.string(),
      hint: z.string().optional(),
      options: z.array(z.string()).optional(),
      context: z.string().optional(),
    }),
  ),
})

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Please sign in to start a lesson" }, { status: 401 })
    }

    const userSettings = await sql`
      SELECT native_language FROM users WHERE id = ${user.id}
    `
    const nativeLanguage = userSettings[0]?.native_language || "English"

    // Fetch user's vocabulary with mastery levels
    const vocabulary = await sql`
      SELECT * FROM vocabulary 
      WHERE user_id = ${user.id}
      ORDER BY mastery_level ASC, last_practiced_at ASC NULLS FIRST
      LIMIT 20
    `

    if (vocabulary.length === 0) {
      return NextResponse.json({ error: "No vocabulary found. Add some words first!" }, { status: 400 })
    }

    // Fetch user's notes for context
    const notes = await sql`
      SELECT content FROM notes 
      WHERE user_id = ${user.id}
      ORDER BY created_at DESC
      LIMIT 5
    `

    const vocabList = vocabulary
      .map((v: any) => `${v.turkish} = ${v.english} (mastery: ${v.mastery_level}/5)`)
      .join("\n")
    const notesList = notes.map((n: any) => n.content).join("\n")

    const prompt = `You are creating a Turkish language lesson for a ${nativeLanguage} speaker. Generate 8 varied exercises based on the user's vocabulary and learning goals.

USER'S NATIVE LANGUAGE: ${nativeLanguage}
All translations should be in ${nativeLanguage}, not English (unless ${nativeLanguage} IS English).

VOCABULARY (prioritize lower mastery items):
${vocabList}

USER'S LEARNING NOTES:
${notesList || "No specific notes"}

EXERCISE TYPES TO USE (mix them up):
1. turkish-to-native: Show Turkish word/phrase, user types ${nativeLanguage} translation
2. native-to-turkish: Show ${nativeLanguage} word/phrase, user types Turkish translation  
3. fill-in-blank: Turkish sentence with a blank, user fills the word
4. multiple-choice: Question with 4 options (set "options" array)
5. sentence-building: Give words to arrange into a sentence

RULES:
- Create exactly 8 exercises
- Use a mix of exercise types
- For fill-in-blank, use ___ to mark the blank in the question
- For multiple-choice, include exactly 4 options with one correct answer
- Add helpful hints in ${nativeLanguage} for harder items
- Include context sentences when helpful
- Focus more on lower mastery vocabulary
- Make exercises progressively harder
- Add cultural context when relevant
- IMPORTANT: All non-Turkish text must be in ${nativeLanguage}`

    const { object } = await generateObject({
      model: openai("gpt-4o"),
      schema: exerciseSchema,
      prompt,
    })

    return NextResponse.json(object)
  } catch (error: any) {
    console.error("Error generating lesson:", error)
    return NextResponse.json(
      { error: error.message || "Failed to generate lesson. Please try again." },
      { status: 500 },
    )
  }
}
