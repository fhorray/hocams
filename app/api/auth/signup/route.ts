import { type NextRequest, NextResponse } from "next/server"
import { createUser, createSession, setSessionCookie } from "@/lib/auth"
import { sql } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
    }

    const user = await createUser(email, password, name)

    if (!user) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 })
    }

    // Create session
    const token = await createSession(user.id)
    await setSessionCookie(token)

    // Initialize user progress
    await sql`
      INSERT INTO user_progress (user_id)
      VALUES (${user.id})
      ON CONFLICT (user_id) DO NOTHING
    `

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    })
  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
