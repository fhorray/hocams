import { sql } from "./db"
import { cookies } from "next/headers"

const SESSION_COOKIE_NAME = "dilvane_session"
const SESSION_DURATION_DAYS = 30

export interface User {
  id: string
  email: string
  name: string | null
  created_at: string
}

export interface Session {
  id: string
  user_id: string
  token: string
  expires_at: string
}

// Hash password using Web Crypto API (works in Edge runtime)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
  // Add salt prefix for additional security
  const salt = crypto.randomUUID()
  const saltedHash = `${salt}:${hashHex}`
  return saltedHash
}

async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [salt, originalHash] = storedHash.split(":")
  if (!salt || !originalHash) return false

  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")

  return hashHex === originalHash
}

function generateSessionToken(): string {
  return crypto.randomUUID() + "-" + crypto.randomUUID()
}

export async function createUser(email: string, password: string, name?: string): Promise<User | null> {
  try {
    const passwordHash = await hashPassword(password)
    const result = await sql`
      INSERT INTO users (email, password_hash, name)
      VALUES (${email.toLowerCase()}, ${passwordHash}, ${name || null})
      RETURNING id, email, name, created_at
    `
    return result[0] as User
  } catch (error: any) {
    if (error.message?.includes("duplicate key")) {
      return null // User already exists
    }
    throw error
  }
}

export async function verifyUser(email: string, password: string): Promise<User | null> {
  const result = await sql`
    SELECT id, email, name, password_hash, created_at
    FROM users
    WHERE email = ${email.toLowerCase()}
  `

  if (result.length === 0) return null

  const user = result[0]
  const isValid = await verifyPassword(password, user.password_hash)

  if (!isValid) return null

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    created_at: user.created_at,
  }
}

export async function createSession(userId: string): Promise<string> {
  const token = generateSessionToken()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS)

  await sql`
    INSERT INTO sessions (user_id, token, expires_at)
    VALUES (${userId}, ${token}, ${expiresAt.toISOString()})
  `

  return token
}

export async function getSessionUser(token: string): Promise<User | null> {
  const result = await sql`
    SELECT u.id, u.email, u.name, u.created_at
    FROM users u
    INNER JOIN sessions s ON s.user_id = u.id
    WHERE s.token = ${token}
    AND s.expires_at > NOW()
  `

  if (result.length === 0) return null
  return result[0] as User
}

export async function deleteSession(token: string): Promise<void> {
  await sql`DELETE FROM sessions WHERE token = ${token}`
}

export async function deleteExpiredSessions(): Promise<void> {
  await sql`DELETE FROM sessions WHERE expires_at < NOW()`
}

// Server-side helpers for getting current user
export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value

  if (!sessionToken) return null

  return getSessionUser(sessionToken)
}

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS)

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  })
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}

export { SESSION_COOKIE_NAME }
