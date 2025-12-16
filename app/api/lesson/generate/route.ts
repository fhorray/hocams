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
      type: z.enum([
        "translate-to-native",
        "translate-to-turkish",
        "word-bank",
        "sentence-arrange",
        "multiple-choice",
        "fill-blank",
        "listening-comprehension",
      ]),
      // For translation/multiple-choice
      question: z.string(),
      answer: z.string(),
      // For word-bank and sentence-arrange
      wordBank: z.array(z.string()).optional(),
      correctOrder: z.array(z.string()).optional(),
      // For multiple-choice
      options: z.array(z.string()).optional(),
      // Additional context
      hint: z.string().optional(),
      context: z.string().optional(),
      // Word details for tap-to-learn
      wordDetails: z
        .array(
          z.object({
            word: z.string(),
            translation: z.string(),
            pronunciation: z.string().optional(),
          }),
        )
        .optional(),
    }),
  ),
})

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Please sign in to start a lesson" }, { status: 401 })
    }

    let nativeLanguage = "English"
    let cefrLevel = "A1"

    try {
      const userSettings = await sql`
        SELECT native_language, cefr_level FROM users WHERE id = ${user.id}
      `
      nativeLanguage = userSettings[0]?.native_language || "English"
      cefrLevel = userSettings[0]?.cefr_level || "A1"
    } catch (settingsError: any) {
      // If columns don't exist, try fetching just native_language
      if (settingsError.message?.includes("cefr_level")) {
        try {
          const basicSettings = await sql`
            SELECT native_language FROM users WHERE id = ${user.id}
          `
          nativeLanguage = basicSettings[0]?.native_language || "English"
        } catch {
          // Use defaults if all fails
        }
      }
    }

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
      .map((v: any) => `- Turkish: "${v.turkish}" | ${nativeLanguage}: "${v.english}" | Mastery: ${v.mastery_level}/5`)
      .join("\n")
    const notesList = notes.map((n: any) => n.content).join("\n")

    const cefrDescriptions: Record<string, string> = {
      A1: "Complete beginner - very simple words, short phrases, basic greetings",
      A2: "Elementary - simple sentences, everyday expressions, basic conversations",
      B1: "Intermediate - can discuss familiar topics, express opinions simply",
      B2: "Upper intermediate - complex texts, fluent conversations, abstract topics",
      C1: "Advanced - nuanced language, idiomatic expressions, academic/professional contexts",
      C2: "Mastery - near-native fluency, subtle meanings, sophisticated expression",
    }

    const prompt = `You are creating a Turkish language lesson for a ${nativeLanguage} speaker at CEFR level ${cefrLevel}.

CRITICAL LANGUAGE RULES:
- The user's native language is ${nativeLanguage}. ALL translations, hints, and instructions MUST be in ${nativeLanguage}.
- Turkish content MUST be 100% Turkish (no mixing).
- ${nativeLanguage} content MUST be 100% ${nativeLanguage} (no mixing).
- NEVER mix languages within the same sentence or phrase.

CEFR LEVEL: ${cefrLevel}
${cefrDescriptions[cefrLevel]}
Adjust complexity, vocabulary, and sentence length accordingly.

USER'S VOCABULARY (prioritize lower mastery items):
${vocabList}

USER'S LEARNING NOTES:
${notesList || "No specific notes"}

EXERCISE TYPES TO CREATE (generate exactly 8 exercises, mix all types):

1. "translate-to-native": Show Turkish text, user types ${nativeLanguage} translation
   - question: Turkish word/phrase (ONLY Turkish)
   - answer: ${nativeLanguage} translation (ONLY ${nativeLanguage})
   - wordDetails: array of {word, translation, pronunciation} for each Turkish word

2. "translate-to-turkish": Show ${nativeLanguage} text, user types Turkish translation
   - question: ${nativeLanguage} word/phrase (ONLY ${nativeLanguage})
   - answer: Turkish translation (ONLY Turkish)

3. "word-bank": User selects words from a bank to build the translation
   - question: Turkish sentence to translate
   - answer: The correct ${nativeLanguage} sentence
   - wordBank: 6-8 words including the correct ones + 2-3 distractors (ALL in ${nativeLanguage})
   - correctOrder: The words in correct order (subset of wordBank)
   - wordDetails: for Turkish words in the question

4. "sentence-arrange": User drags Turkish words into correct order
   - question: ${nativeLanguage} sentence (what they need to say in Turkish)
   - answer: The correct Turkish sentence
   - wordBank: The Turkish words shuffled + 1-2 distractor words (ALL in Turkish)
   - correctOrder: Turkish words in correct grammatical order

5. "multiple-choice": Pick the correct translation
   - question: Turkish word/phrase
   - answer: Correct ${nativeLanguage} translation
   - options: 4 ${nativeLanguage} options (one correct, three plausible distractors)

6. "fill-blank": Complete the Turkish sentence
   - question: Turkish sentence with ___ for the blank
   - answer: The missing Turkish word
   - hint: ${nativeLanguage} translation of the full sentence
   - options: 4 Turkish word options

IMPORTANT RULES:
- Create EXACTLY 8 exercises with a good mix of types
- Include at least 2 "word-bank" and 2 "sentence-arrange" exercises for interactivity
- For word-bank exercises, wordBank should have 6-8 words total
- For sentence-arrange, shuffle the Turkish words and add 1-2 distractor words
- All hints MUST be in ${nativeLanguage}
- Focus on vocabulary items with lower mastery (0-2)
- Make exercises progressively harder
- Add wordDetails for exercises that show Turkish text (helps users learn word-by-word)`

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
