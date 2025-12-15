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

    const result = await sql`
      SELECT native_language FROM users WHERE id = ${user.id}
    `

    return NextResponse.json({
      native_language: result[0]?.native_language || "English",
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

    const { native_language } = await req.json()

    if (!native_language || typeof native_language !== "string") {
      return NextResponse.json({ error: "Invalid language" }, { status: 400 })
    }

    await sql`
      UPDATE users 
      SET native_language = ${native_language}, updated_at = NOW()
      WHERE id = ${user.id}
    `

    return NextResponse.json({ success: true, native_language })
  } catch (error) {
    console.error("Error updating user settings:", error)
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
  }
}
