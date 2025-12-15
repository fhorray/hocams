"use client"

import type React from "react"
import { useState } from "react"
import { useApp } from "@/components/providers/app-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { BookOpen, Loader2, Mail, Lock, User } from "lucide-react"

export function AuthScreen() {
  const [mode, setMode] = useState<"signin" | "signup">("signin")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const { signIn, signUp } = useApp()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      if (mode === "signup") {
        const result = await signUp(email, password, name)
        if (result.error) {
          setError(result.error)
        }
      } else {
        const result = await signIn(email, password)
        if (result.error) {
          setError(result.error)
        }
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col px-6 py-12 bg-background">
      {/* Logo */}
      <div className="text-center mb-12">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <BookOpen className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-primary">Dilvane</h1>
        <p className="text-muted-foreground mt-2">Your Turkish Learning Journey</p>
      </div>

      {/* Auth Form */}
      <Card className="p-6 space-y-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground">
            {mode === "signin" ? "Welcome Back" : "Create Account"}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === "signin" ? "Sign in to continue learning" : "Start your Turkish journey today"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-12 pl-11"
              />
            </div>
          )}

          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 pl-11"
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 pl-11"
              required
              minLength={8}
            />
          </div>

          {error && <p className="text-sm text-destructive text-center bg-destructive/10 p-3 rounded-lg">{error}</p>}

          <Button type="submit" className="w-full h-12 font-medium" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : mode === "signin" ? (
              "Sign In"
            ) : (
              "Create Account"
            )}
          </Button>
        </form>

        <div className="text-center">
          <button
            type="button"
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin")
              setError("")
            }}
            className="text-sm text-primary font-medium"
          >
            {mode === "signin" ? "Need an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </Card>

      {/* Features */}
      <div className="mt-8 space-y-3">
        <Feature text="AI-powered personalized lessons" />
        <Feature text="Track your progress and streaks" />
        <Feature text="Learn at your own pace" />
      </div>
    </div>
  )
}

function Feature({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 text-muted-foreground">
      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
      <span className="text-sm">{text}</span>
    </div>
  )
}
