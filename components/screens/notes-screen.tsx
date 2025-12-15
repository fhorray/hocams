"use client"

import { useState } from "react"
import { useApp } from "@/components/providers/app-provider"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Plus, Trash2, X, Info, Brain, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export function NotesScreen() {
  const { notes, addNote, removeNote, isLoading } = useApp()
  const [isAdding, setIsAdding] = useState(false)
  const [content, setContent] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const handleAdd = async () => {
    if (content.trim()) {
      setIsSaving(true)
      await addNote(content.trim())
      setContent("")
      setIsAdding(false)
      setIsSaving(false)
    }
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
          <h1 className="text-xl font-bold text-foreground">Learning Notes</h1>
          <p className="text-sm text-muted-foreground">{notes.length} notes</p>
        </div>
        {!isAdding && (
          <Button onClick={() => setIsAdding(true)} size="icon" className="rounded-full w-12 h-12">
            <Plus className="w-5 h-5" />
          </Button>
        )}
      </div>

      {/* Info Banner */}
      <Card className="p-4 bg-primary/5 border-primary/20 flex gap-3">
        <Brain className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-foreground mb-1">AI-Guided Learning</p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Your notes help the AI understand what you want to learn. Write about grammar, expressions, or concepts you
            want to practice.
          </p>
        </div>
      </Card>

      {/* Add Form */}
      {isAdding && (
        <Card className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-foreground">Add Learning Goal</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setIsAdding(false)
                setContent("")
              }}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          <Textarea
            placeholder="E.g., I want to understand how 'keşke' is used and practice conditional sentences..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[120px] resize-none"
          />
          <Button onClick={handleAdd} className="w-full h-12" disabled={!content.trim() || isSaving}>
            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Add Note"}
          </Button>
        </Card>
      )}

      {/* Example Prompts */}
      {notes.length === 0 && !isAdding && (
        <Card className="p-4 space-y-3">
          <p className="text-sm font-medium text-foreground">Example learning goals:</p>
          <div className="space-y-2">
            {[
              "I want to practice past tense verbs",
              "Help me understand Turkish suffixes better",
              "I need more practice with question words",
              "Focus on common everyday phrases",
            ].map((example, i) => (
              <button
                key={i}
                onClick={() => {
                  setContent(example)
                  setIsAdding(true)
                }}
                className="w-full text-left p-3 rounded-lg bg-muted/50 hover:bg-muted text-sm text-muted-foreground transition-colors"
              >
                "{example}"
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Notes List */}
      {notes.length === 0 && !isAdding ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Info className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-foreground font-medium mb-2">No notes yet</p>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">Add notes to guide your AI lessons</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <Card
              key={note.id}
              className={cn("p-4 flex items-start justify-between gap-3", "active:bg-muted/50 transition-colors")}
            >
              <p className="text-sm text-foreground leading-relaxed flex-1">{note.content}</p>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeNote(note.id)}
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
