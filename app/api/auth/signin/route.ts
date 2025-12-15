import { type NextRequest, NextResponse } from "next/server"
import { verifyUser, createSession, setSessionCookie } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const user = await verifyUser(email, password)

    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    // Create session
    const token = await createSession(user.id)
    await setSessionCookie(token)

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    })
  } catch (error) {
    console.error("Signin error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
