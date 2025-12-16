"use client"

import { useApp } from "@/components/providers/app-provider"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  LogOut,
  Flame,
  Trophy,
  Target,
  BookOpen,
  Award,
  ChevronRight,
  History,
  Globe,
  Check,
  GraduationCap,
} from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"

const SUPPORTED_LANGUAGES = [
  { code: "English", name: "English", flag: "🇬🇧" },
  { code: "German", name: "Deutsch", flag: "🇩🇪" },
  { code: "French", name: "Français", flag: "🇫🇷" },
  { code: "Spanish", name: "Español", flag: "🇪🇸" },
  { code: "Italian", name: "Italiano", flag: "🇮🇹" },
  { code: "Portuguese", name: "Português", flag: "🇵🇹" },
  { code: "Dutch", name: "Nederlands", flag: "🇳🇱" },
  { code: "Russian", name: "Русский", flag: "🇷🇺" },
  { code: "Arabic", name: "العربية", flag: "🇸🇦" },
  { code: "Chinese", name: "中文", flag: "🇨🇳" },
  { code: "Japanese", name: "日本語", flag: "🇯🇵" },
  { code: "Korean", name: "한국어", flag: "🇰🇷" },
]

const CEFR_LEVELS = [
  { code: "A1", name: "A1 - Beginner", description: "Can understand and use basic phrases" },
  { code: "A2", name: "A2 - Elementary", description: "Can handle simple, routine tasks" },
  { code: "B1", name: "B1 - Intermediate", description: "Can deal with most travel situations" },
  { code: "B2", name: "B2 - Upper Intermediate", description: "Can interact with native speakers" },
  { code: "C1", name: "C1 - Advanced", description: "Can use language flexibly" },
  { code: "C2", name: "C2 - Mastery", description: "Can understand virtually everything" },
]

export function ProfileScreen() {
  const { vocabulary, progress, user, signOut } = useApp()

  const [nativeLanguage, setNativeLanguage] = useState("English")
  const [cefrLevel, setCefrLevel] = useState("A1")
  const [savingLanguage, setSavingLanguage] = useState(false)
  const [languageSaved, setLanguageSaved] = useState(false)
  const [savingLevel, setSavingLevel] = useState(false)
  const [levelSaved, setLevelSaved] = useState(false)

  useEffect(() => {
    fetch("/api/user/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.native_language) {
          setNativeLanguage(data.native_language)
        }
        if (data.cefr_level) {
          setCefrLevel(data.cefr_level)
        }
      })
      .catch(console.error)
  }, [])

  const handleLanguageChange = async (language: string) => {
    setNativeLanguage(language)
    setSavingLanguage(true)
    setLanguageSaved(false)

    try {
      const res = await fetch("/api/user/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ native_language: language }),
      })

      if (res.ok) {
        setLanguageSaved(true)
        setTimeout(() => setLanguageSaved(false), 2000)
      }
    } catch (error) {
      console.error("Failed to save language:", error)
    } finally {
      setSavingLanguage(false)
    }
  }

  const handleCefrLevelChange = async (level: string) => {
    setCefrLevel(level)
    setSavingLevel(true)
    setLevelSaved(false)

    try {
      const res = await fetch("/api/user/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cefr_level: level }),
      })

      if (res.ok) {
        setLevelSaved(true)
        setTimeout(() => setLevelSaved(false), 2000)
      }
    } catch (error) {
      console.error("Failed to save CEFR level:", error)
    } finally {
      setSavingLevel(false)
    }
  }

  const currentStreak = progress?.current_streak || 0
  const longestStreak = progress?.longest_streak || 0
  const xpPoints = progress?.xp_points || 0
  const level = progress?.level || 1
  const totalLessons = progress?.total_lessons || 0
  const totalWordsLearned = progress?.total_words_learned || 0

  // Calculate level progress
  const xpForCurrentLevel = (level - 1) * 100
  const xpForNextLevel = level * 100
  const xpInCurrentLevel = xpPoints - xpForCurrentLevel
  const xpNeededForLevel = xpForNextLevel - xpForCurrentLevel
  const levelProgress = (xpInCurrentLevel / xpNeededForLevel) * 100

  // Calculate mastery stats
  const masteredWords = vocabulary.filter((v) => v.mastery_level >= 4).length
  const learningWords = vocabulary.filter((v) => v.mastery_level > 0 && v.mastery_level < 4).length

  const achievements = [
    { name: "First Word", description: "Add your first vocabulary word", unlocked: totalWordsLearned >= 1 },
    { name: "Word Collector", description: "Add 10 vocabulary words", unlocked: totalWordsLearned >= 10 },
    { name: "First Lesson", description: "Complete your first lesson", unlocked: totalLessons >= 1 },
    { name: "Dedicated Learner", description: "Complete 10 lessons", unlocked: totalLessons >= 10 },
    { name: "On Fire", description: "Reach a 7-day streak", unlocked: longestStreak >= 7 },
    { name: "Master", description: "Master 5 vocabulary words", unlocked: masteredWords >= 5 },
  ]

  const unlockedCount = achievements.filter((a) => a.unlocked).length

  return (
    <div className="px-6 py-6 space-y-6 pb-24">
      {/* Profile Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground text-xl font-bold">
            {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || "U"}
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">{user?.name || "Learner"}</h1>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={signOut} className="text-muted-foreground">
          <LogOut className="w-5 h-5" />
        </Button>
      </div>

      {/* CEFR Level Settings */}
      <Card className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-950/30 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-foreground">Turkish Proficiency Level</p>
            <p className="text-sm text-muted-foreground">Lessons adapt to your current level</p>
          </div>
          {levelSaved && (
            <div className="flex items-center gap-1 text-green-600 text-sm">
              <Check className="w-4 h-4" />
              Saved
            </div>
          )}
        </div>
        <Select value={cefrLevel} onValueChange={handleCefrLevelChange} disabled={savingLevel}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select your level" />
          </SelectTrigger>
          <SelectContent>
            {CEFR_LEVELS.map((level) => (
              <SelectItem key={level.code} value={level.code}>
                <div className="flex flex-col items-start">
                  <span className="font-medium">{level.name}</span>
                  <span className="text-xs text-muted-foreground">{level.description}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground mt-2">
          CEFR (Common European Framework) helps us adjust lesson difficulty
        </p>
      </Card>

      {/* Language Settings */}
      <Card className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Globe className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-foreground">Native Language</p>
            <p className="text-sm text-muted-foreground">Translations will be in this language</p>
          </div>
          {languageSaved && (
            <div className="flex items-center gap-1 text-green-600 text-sm">
              <Check className="w-4 h-4" />
              Saved
            </div>
          )}
        </div>
        <Select value={nativeLanguage} onValueChange={handleLanguageChange} disabled={savingLanguage}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select your native language" />
          </SelectTrigger>
          <SelectContent>
            {SUPPORTED_LANGUAGES.map((lang) => (
              <SelectItem key={lang.code} value={lang.code}>
                <span className="flex items-center gap-2">
                  <span>{lang.flag}</span>
                  <span>{lang.name}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Card>

      {/* Level Card */}
      <Card className="p-5 bg-gradient-to-br from-primary/10 to-primary/5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
              <span className="text-lg font-bold text-primary-foreground">{level}</span>
            </div>
            <div>
              <p className="font-semibold text-foreground">Level {level}</p>
              <p className="text-sm text-muted-foreground">{xpPoints} total XP</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-primary">{xpNeededForLevel - xpInCurrentLevel} XP</p>
            <p className="text-xs text-muted-foreground">to next level</p>
          </div>
        </div>
        <Progress value={levelProgress} className="h-3" />
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4 bg-orange-50 dark:bg-orange-950/20 border-0">
          <Flame className="w-6 h-6 text-orange-500 mb-2" />
          <p className="text-2xl font-bold text-foreground">{currentStreak}</p>
          <p className="text-xs text-muted-foreground">Current Streak</p>
          {longestStreak > currentStreak && (
            <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">Best: {longestStreak} days</p>
          )}
        </Card>

        <Card className="p-4 bg-green-50 dark:bg-green-950/20 border-0">
          <Target className="w-6 h-6 text-green-500 mb-2" />
          <p className="text-2xl font-bold text-foreground">{masteredWords}</p>
          <p className="text-xs text-muted-foreground">Words Mastered</p>
          {learningWords > 0 && (
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">{learningWords} learning</p>
          )}
        </Card>

        <Card className="p-4 bg-blue-50 dark:bg-blue-950/20 border-0">
          <BookOpen className="w-6 h-6 text-blue-500 mb-2" />
          <p className="text-2xl font-bold text-foreground">{totalWordsLearned}</p>
          <p className="text-xs text-muted-foreground">Total Words</p>
        </Card>

        <Card className="p-4 bg-purple-50 dark:bg-purple-950/20 border-0">
          <Trophy className="w-6 h-6 text-purple-500 mb-2" />
          <p className="text-2xl font-bold text-foreground">{totalLessons}</p>
          <p className="text-xs text-muted-foreground">Lessons Done</p>
        </Card>
      </div>

      {/* Lesson History Link */}
      <Link href="/history">
        <Card className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
              <History className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium text-foreground">Lesson History</p>
              <p className="text-sm text-muted-foreground">View your past lessons</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </Card>
      </Link>

      {/* Achievements */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-foreground">Achievements</h2>
          <span className="text-sm text-muted-foreground">
            {unlockedCount}/{achievements.length}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {achievements.map((achievement, i) => (
            <Card
              key={i}
              className={`p-3 text-center border-0 ${achievement.unlocked ? "bg-yellow-50 dark:bg-yellow-950/20" : "bg-muted/30 opacity-50"}`}
            >
              <Award
                className={`w-8 h-8 mx-auto mb-2 ${achievement.unlocked ? "text-yellow-500" : "text-muted-foreground"}`}
              />
              <p className="text-xs font-medium text-foreground truncate">{achievement.name}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
