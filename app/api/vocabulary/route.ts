import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const vocabulary = await sql`
      SELECT * FROM vocabulary 
      WHERE user_id = ${user.id} 
      ORDER BY created_at DESC
    `
    return NextResponse.json(vocabulary)
  } catch (error) {
    console.error("Error fetching vocabulary:", error)
    return NextResponse.json({ error: "Failed to fetch vocabulary" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { turkish, english } = await req.json()

    if (!turkish || !english) {
      return NextResponse.json({ error: "Turkish and English are required" }, { status: 400 })
    }

    const [newWord] = await sql`
      INSERT INTO vocabulary (user_id, turkish, english)
      VALUES (${user.id}, ${turkish}, ${english})
      RETURNING *
    `

    // Update user progress
    await sql`
      INSERT INTO user_progress (user_id, total_words_learned)
      VALUES (${user.id}, 1)
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        total_words_learned = user_progress.total_words_learned + 1,
        updated_at = NOW()
    `

    return NextResponse.json(newWord)
  } catch (error) {
    console.error("Error adding vocabulary:", error)
    return NextResponse.json({ error: "Failed to add vocabulary" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 })
    }

    await sql`
      DELETE FROM vocabulary 
      WHERE id = ${id} AND user_id = ${user.id}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting vocabulary:", error)
    return NextResponse.json({ error: "Failed to delete vocabulary" }, { status: 500 })
  }
}
