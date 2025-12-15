import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { deleteSession, clearSessionCookie, SESSION_COOKIE_NAME } from "@/lib/auth"

export async function POST() {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value

    if (sessionToken) {
      await deleteSession(sessionToken)
    }

    await clearSessionCookie()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Signout error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
