"use client"

import { useState } from "react"
import { useApp } from "@/components/providers/app-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Plus, Trash2, X, Target, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export function VocabularyScreen() {
  const { vocabulary, addVocabulary, removeVocabulary, isLoading } = useApp()
  const [isAdding, setIsAdding] = useState(false)
  const [turkish, setTurkish] = useState("")
  const [english, setEnglish] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const handleAdd = async () => {
    if (turkish.trim() && english.trim()) {
      setIsSaving(true)
      await addVocabulary(turkish.trim(), english.trim())
      setTurkish("")
      setEnglish("")
      setIsAdding(false)
      setIsSaving(false)
    }
  }

  const getMasteryColor = (level: number) => {
    if (level >= 4) return "bg-green-500"
    if (level >= 2) return "bg-yellow-500"
    return "bg-muted"
  }

  const getMasteryLabel = (level: number) => {
    if (level >= 4) return "Mastered"
    if (level >= 2) return "Learning"
    if (level >= 1) return "Practicing"
    return "New"
  }

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Vocabulary</h1>
          <p className="text-sm text-muted-foreground">{vocabulary.length} words</p>
        </div>
        {!isAdding && (
          <Button onClick={() => setIsAdding(true)} size="icon" className="rounded-full w-12 h-12">
            <Plus className="w-5 h-5" />
          </Button>
        )}
      </div>

      {/* Stats Summary */}
      {vocabulary.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-3 text-center border-0 bg-muted/50">
            <p className="text-lg font-bold text-foreground">{vocabulary.filter((v) => v.mastery_level >= 4).length}</p>
            <p className="text-xs text-muted-foreground">Mastered</p>
          </Card>
          <Card className="p-3 text-center border-0 bg-muted/50">
            <p className="text-lg font-bold text-foreground">
              {vocabulary.filter((v) => v.mastery_level > 0 && v.mastery_level < 4).length}
            </p>
            <p className="text-xs text-muted-foreground">Learning</p>
          </Card>
          <Card className="p-3 text-center border-0 bg-muted/50">
            <p className="text-lg font-bold text-foreground">
              {vocabulary.filter((v) => v.mastery_level === 0).length}
            </p>
            <p className="text-xs text-muted-foreground">New</p>
          </Card>
        </div>
      )}

      {/* Add Form */}
      {isAdding && (
        <Card className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-foreground">Add New Word</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setIsAdding(false)
                setTurkish("")
                setEnglish("")
              }}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          <div className="space-y-3">
            <Input
              placeholder="Turkish word or phrase"
              value={turkish}
              onChange={(e) => setTurkish(e.target.value)}
              className="h-12"
            />
            <Input
              placeholder="English meaning"
              value={english}
              onChange={(e) => setEnglish(e.target.value)}
              className="h-12"
              onKeyDown={(e) => {
                if (e.key === "Enter" && turkish.trim() && english.trim()) {
                  handleAdd()
                }
              }}
            />
          </div>
          <Button onClick={handleAdd} className="w-full h-12" disabled={!turkish.trim() || !english.trim() || isSaving}>
            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Add Word"}
          </Button>
        </Card>
      )}

      {/* Vocabulary List */}
      {vocabulary.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-foreground font-medium mb-2">No words yet</p>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            Add Turkish words to build your personalized lessons. The AI will create exercises based on your vocabulary.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {vocabulary.map((item) => (
            <Card
              key={item.id}
              className={cn("p-4 flex items-center justify-between gap-3", "active:bg-muted/50 transition-colors")}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-foreground truncate">{item.turkish}</p>
                  <span
                    className={cn(
                      "text-xs px-2 py-0.5 rounded-full",
                      item.mastery_level >= 4
                        ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400"
                        : item.mastery_level >= 2
                          ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400"
                          : "bg-muted text-muted-foreground",
                    )}
                  >
                    {getMasteryLabel(item.mastery_level)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground truncate">{item.english}</p>
                <Progress value={(item.mastery_level / 5) * 100} className="h-1 mt-2" />
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeVocabulary(item.id)}
                className="text-muted-foreground hover:text-destructive shrink-0"
              >
                <Trash2 className="w-5 h-5" />
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
