import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const history = await sql`
      SELECT * FROM lesson_history 
      WHERE user_id = ${user.id} 
      ORDER BY completed_at DESC
      LIMIT 10
    `
    return NextResponse.json(history)
  } catch (error) {
    console.error("Error fetching lesson history:", error)
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 })
  }
}
