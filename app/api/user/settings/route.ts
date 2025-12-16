import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

// GET user settings
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let nativeLanguage = "English"
    let cefrLevel = "A1"

    try {
      const result = await sql`
        SELECT native_language, cefr_level FROM users WHERE id = ${user.id}
      `
      nativeLanguage = result[0]?.native_language || "English"
      cefrLevel = result[0]?.cefr_level || "A1"
    } catch (error: any) {
      // If cefr_level column doesn't exist, try without it
      if (error.message?.includes("cefr_level")) {
        try {
          const result = await sql`
            SELECT native_language FROM users WHERE id = ${user.id}
          `
          nativeLanguage = result[0]?.native_language || "English"
        } catch {
          // Use defaults
        }
      }
    }

    return NextResponse.json({
      native_language: nativeLanguage,
      cefr_level: cefrLevel,
    })
  } catch (error) {
    console.error("Error fetching user settings:", error)
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
  }
}

// PUT update user settings
export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { native_language, cefr_level } = await req.json()

    if (native_language && typeof native_language !== "string") {
      return NextResponse.json({ error: "Invalid language" }, { status: 400 })
    }

    if (cefr_level && !["A1", "A2", "B1", "B2", "C1", "C2"].includes(cefr_level)) {
      return NextResponse.json({ error: "Invalid CEFR level" }, { status: 400 })
    }

    try {
      if (native_language && cefr_level) {
        await sql`
          UPDATE users 
          SET native_language = ${native_language},
              cefr_level = ${cefr_level},
              updated_at = NOW()
          WHERE id = ${user.id}
        `
      } else if (native_language) {
        await sql`
          UPDATE users 
          SET native_language = ${native_language},
              updated_at = NOW()
          WHERE id = ${user.id}
        `
      } else if (cefr_level) {
        await sql`
          UPDATE users 
          SET cefr_level = ${cefr_level},
              updated_at = NOW()
          WHERE id = ${user.id}
        `
      }
    } catch (error: any) {
      // If cefr_level column doesn't exist, just update native_language
      if (error.message?.includes("cefr_level") && native_language) {
        await sql`
          UPDATE users 
          SET native_language = ${native_language},
              updated_at = NOW()
          WHERE id = ${user.id}
        `
      } else {
        throw error
      }
    }

    return NextResponse.json({ success: true, native_language, cefr_level })
  } catch (error) {
    console.error("Error updating user settings:", error)
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
  }
}
