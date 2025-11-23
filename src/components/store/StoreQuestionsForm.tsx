"use client"

import type { ReactNode } from "react"
import { useCallback, useEffect, useMemo, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { AlertCircle, CheckCircle2, Loader2, RefreshCcw, Save } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  StoreQuestionAnswer,
  getStoreQuestions,
  upsertStoreAnswers,
} from "@/services/storeQuestionService"
import { cn } from "@/lib/utils"

type AnswerState = Record<number, { text?: string; value?: string; values?: string[] }>

type StoreQuestionsFormProps = {
  canEdit?: boolean
}

export function StoreQuestionsForm(props: StoreQuestionsFormProps) {
  return (
    <Suspense fallback={<div className="p-4 text-center text-emerald-600">Loading form...</div>}>
      <StoreQuestionsFormContent {...props} />
    </Suspense>
  )
}

function StoreQuestionsFormContent({ canEdit = true }: StoreQuestionsFormProps) {
  const searchParams = useSearchParams()
  const storeIdParam = searchParams.get("storeId")
  const storeId = useMemo(() => Number(storeIdParam), [storeIdParam])
  const hasValidStoreId = Number.isInteger(storeId) && !Number.isNaN(storeId)

  const [questions, setQuestions] = useState<StoreQuestionAnswer[]>([])
  const [answers, setAnswers] = useState<AnswerState>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const buildInitialAnswers = useCallback((items: StoreQuestionAnswer[]) => {
    const next: AnswerState = {}
    items.forEach((item) => {
      next[item.template.id] = {
        text: item.answer?.value.text ?? "",
        value: item.answer?.value.value ?? "",
        values: item.answer?.value.values ?? [],
      }
    })
    return next
  }, [])

  const loadQuestions = useCallback(async () => {
    if (!hasValidStoreId) {
      setError("Store id is missing. Please provide ?storeId=<id> in the URL.")
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const data = await getStoreQuestions()
      setQuestions(data)
      setAnswers(buildInitialAnswers(data))
    } catch (err) {
      console.error("Failed to load store questions", err)
      setError(err instanceof Error ? err.message : "Failed to load store questions")
    } finally {
      setLoading(false)
    }
  }, [buildInitialAnswers, hasValidStoreId, storeId])

  useEffect(() => {
    loadQuestions()
  }, [loadQuestions])

  const handleTextChange = (id: number, text: string) => {
    setAnswers((prev) => ({
      ...prev,
      [id]: { ...prev[id], text },
    }))
  }

  const handleSingleSelectChange = (id: number, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [id]: { ...prev[id], value },
    }))
  }

  const handleMultiSelectToggle = (id: number, optionValue: string) => {
    setAnswers((prev) => {
      const current = prev[id]?.values ?? []
      const exists = current.includes(optionValue)
      const values = exists ? current.filter((v) => v !== optionValue) : [...current, optionValue]
      return {
        ...prev,
        [id]: { ...prev[id], values },
      }
    })
  }

  const handleSaveAnswers = async () => {
    if (!hasValidStoreId) return

    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const payload = {
        answers: questions.map((q) => {
          const current = answers[q.template.id] ?? {}
          if (q.template.type === "TEXT") {
            return { id: q.template.id, text: current.text ?? "" }
          }
          if (q.template.type === "SINGLE_SELECT") {
            return { id: q.template.id, value: current.value ?? "" }
          }
          return { id: q.template.id, values: current.values ?? [] }
        }),
      }

      const updated = await upsertStoreAnswers(storeId, payload)
      setQuestions(updated)
      setAnswers(buildInitialAnswers(updated))
      setSuccess("Answers saved successfully.")
    } catch (err) {
      console.error("Failed to save store question answers", err)
      setError(err instanceof Error ? err.message : "Failed to save answers")
    } finally {
      setSaving(false)
    }
  }

  const renderQuestionInput = (question: StoreQuestionAnswer) => {
    const { template } = question
    const answer = answers[template.id] ?? question.answer

    if (template.type === "TEXT") {
      const isLong = (template.description || "").length > 80
      return isLong ? (
        <Textarea
          value={answer?.text ?? ""}
          onChange={(event) => handleTextChange(template.id, event.target.value)}
          placeholder="Type your answer"
          disabled={!canEdit || saving}
        />
      ) : (
        <Input
          value={answer?.text ?? ""}
          onChange={(event) => handleTextChange(template.id, event.target.value)}
          placeholder="Type your answer"
          disabled={!canEdit || saving}
        />
      )
    }

    if (template.type === "SINGLE_SELECT") {
      return (
        <Select
          value={answer?.value ?? ""}
          onValueChange={(value) => handleSingleSelectChange(template.id, value)}
          disabled={!canEdit || saving}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            {template.options?.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    }

    if (template.type === "MULTI_SELECT") {
      return (
        <div className="flex flex-col gap-2">
          {template.options?.map((option) => {
            const checked = answer?.values?.includes(option.value) ?? false
            return (
              <label
                key={option.value}
                className={cn(
                  "flex items-center gap-3 rounded-lg border px-3 py-2 text-sm",
                  checked ? "border-emerald-300 bg-emerald-50" : "border-gray-200"
                )}
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-emerald-600"
                  checked={checked}
                  onChange={() => handleMultiSelectToggle(template.id, option.value)}
                  disabled={!canEdit || saving}
                />
                <span className="text-gray-800">{option.label}</span>
              </label>
            )
          })}
        </div>
      )
    }

    return null
  }

  return (
    <Card className="border-emerald-100 bg-white/90 shadow-md">
      <CardHeader className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-emerald-800">Store Environment Questions</CardTitle>
          <CardDescription>
            Answer a few questions about your store setup. Changes are saved per store.
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={loadQuestions}
            disabled={loading || saving}
            className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button
            type="button"
            onClick={handleSaveAnswers}
            disabled={!canEdit || saving || loading || !hasValidStoreId || questions.length === 0}
            className="bg-emerald-600 text-white hover:bg-emerald-700"
          >
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save answers
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {!hasValidStoreId && (
          <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-4 py-3 text-amber-800">
            <AlertCircle className="h-4 w-4" />
            <span>{error ?? "Store id is missing"}</span>
          </div>
        )}

        {loading && (
          <div className="flex items-center gap-2 text-emerald-700">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading questions...</span>
          </div>
        )}

        {!loading && error && (
          <div className="flex items-center gap-2 rounded-lg bg-rose-50 px-4 py-3 text-rose-700">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && questions.length === 0 && (
          <p className="text-sm text-gray-600">No questions available for this store.</p>
        )}

        {!loading &&
          !error &&
          questions.map((question) => (
            <div
              key={question.template.id}
              className="rounded-xl border border-emerald-100 bg-emerald-50/30 p-4"
            >
              <div className="flex flex-col gap-1">
                <div className="flex items-start justify-between gap-2">
                  <Label className="text-base font-semibold text-emerald-900">
                    {question.template.label}
                  </Label>
                  <Badge tone="muted">{question.template.type}</Badge>
                </div>
                {question.template.description && (
                  <p className="text-sm text-emerald-800/80">{question.template.description}</p>
                )}
              </div>
              <div className="mt-3">{renderQuestionInput(question)}</div>
            </div>
          ))}

        {success && (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-emerald-800">
            <CheckCircle2 className="h-4 w-4" />
            <span>{success}</span>
          </div>
        )}

        {!canEdit && (
          <p className="text-xs text-amber-700">
            You do not have permission to edit these answers. Viewing only.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

const Badge = ({
  children,
  tone = "muted",
}: {
  children: ReactNode
  tone?: "muted" | "info"
}) => {
  const color =
    tone === "info"
      ? "bg-emerald-100 text-emerald-800 border-emerald-200"
      : "bg-slate-100 text-slate-700 border-slate-200"
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide",
        color
      )}
    >
      {children}
    </span>
  )
}
