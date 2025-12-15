import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const [progress] = await sql`
      SELECT * FROM user_progress 
      WHERE user_id = ${user.id}
    `

    if (!progress) {
      // Create initial progress record
      const [newProgress] = await sql`
        INSERT INTO user_progress (user_id)
        VALUES (${user.id})
        RETURNING *
      `
      return NextResponse.json(newProgress)
    }

    return NextResponse.json(progress)
  } catch (error) {
    console.error("Error fetching progress:", error)
    return NextResponse.json({ error: "Failed to fetch progress" }, { status: 500 })
  }
}
