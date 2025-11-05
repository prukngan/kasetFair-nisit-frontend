"use client"

import { useCallback, useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { StepIndicator } from "@/components/createStep/step-indicator"
import { StepOneForm } from "@/components/createStep/step-one-form"
import { StepTwoForm } from "@/components/createStep/step-two-form"
import { StepThreeForm } from "@/components/createStep/step-three-form"

type ProductFormState = {
  id: string
  name: string
  price: string
  file: File | null
  fileName: string | null
}

const STEP_DEFINITIONS = [
  { id: 1, label: "สร้างร้านค้า" },
  { id: 2, label: "รายละเอียดร้านค้า" },
  { id: 3, label: "ข้อมูลสินค้า" },
  { id: 4, label: "เพิ่มเติม" },
] as const

const MIN_MEMBERS = 3

const createProduct = (): ProductFormState => ({
  id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `product-${Math.random().toString(16).slice(2)}`,
  name: "",
  price: "",
  file: null,
  fileName: null,
})

export default function StoreCreatePage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const currentStep = useMemo(() => {
    const raw = Number(searchParams.get("step")) || 1
    if (raw < 1) return 1
    if (raw > 3) return 3
    return raw
  }, [searchParams])

  const [storeName, setStoreName] = useState("")
  const [members, setMembers] = useState<string[]>(
    Array.from({ length: MIN_MEMBERS }, () => "")
  )
  const [layoutDescription, setLayoutDescription] = useState("")
  const [layoutFile, setLayoutFile] = useState<File | null>(null)
  const [products, setProducts] = useState<ProductFormState[]>([createProduct(), createProduct(), createProduct()])
  const [saving, setSaving] = useState(false)

  const stepStatuses = STEP_DEFINITIONS.map((step) => ({
    id: step.id,
    label: step.label,
    status:
      step.id < currentStep ? "completed" : step.id === currentStep ? "current" : "upcoming",
  })) as Array<{ id: number; label: string; status: "completed" | "current" | "upcoming" }>

  const updateStepParam = useCallback(
    (step: number) => {
      const next = Math.max(1, Math.min(3, step))
      const params = new URLSearchParams(searchParams.toString())
      params.set("step", String(next))
      const queryString = params.toString()
      router.replace(`${pathname}?${queryString}`, { scroll: false })
    },
    [pathname, router, searchParams]
  )

  const handleNext = useCallback(
    (step: number) => {
      setSaving(false)
      updateStepParam(step)
    },
    [updateStepParam]
  )

  const handleSimulatedSave = async (targetStep: number) => {
    setSaving(true)
    await new Promise((resolve) => setTimeout(resolve, 250))
    handleNext(targetStep)
  }

  const handleMemberChange = (index: number, value: string) => {
    setMembers((prev) => {
      const next = [...prev]
      next[index] = value
      return next
    })
  }

  const handleAddMember = () => {
    setMembers((prev) => [...prev, ""])
  }

  const handleRemoveMember = (index: number) => {
    setMembers((prev) => prev.filter((_, i) => i !== index))
  }

  const handleProductChange = (id: string, field: "name" | "price", value: string) => {
    setProducts((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    )
  }

  const handleProductFileChange = (id: string, file: File | null) => {
    setProducts((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              file,
              fileName: file ? file.name : null,
            }
          : item
      )
    )
  }

  const handleAddProduct = () => {
    setProducts((prev) => [...prev, createProduct()])
  }

  const handleRemoveProduct = (id: string) => {
    setProducts((prev) => (prev.length === 1 ? prev : prev.filter((item) => item.id !== id)))
  }

  const handleFinalSubmit = async () => {
    setSaving(true)
    await new Promise((resolve) => setTimeout(resolve, 400))
    console.log("Store draft submitted", {
      storeName,
      members,
      layoutDescription,
      layoutFile,
      products,
    })
    setSaving(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100 px-4 py-12">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <header className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-emerald-800">ลงทะเบียนสร้างร้าน</h1>
            <p className="mt-2 text-sm text-emerald-700">
              กรอกข้อมูลให้ครบทุกขั้นตอนเพื่อเตรียมเปิดร้านในงาน Kaset Fair 2026
            </p>
          </div>
          <StepIndicator steps={stepStatuses} />
        </header>

        {currentStep === 1 && (
          <StepOneForm
            storeName={storeName}
            members={members}
            onStoreNameChange={setStoreName}
            onMemberChange={handleMemberChange}
            onAddMember={handleAddMember}
            onRemoveMember={handleRemoveMember}
            onNext={() => handleSimulatedSave(2)}
            saving={saving}
          />
        )}

        {currentStep === 2 && (
          <StepTwoForm
            layoutDescription={layoutDescription}
            layoutFileName={layoutFile?.name ?? null}
            onDescriptionChange={setLayoutDescription}
            onFileChange={setLayoutFile}
            onBack={() => updateStepParam(1)}
            onNext={() => handleSimulatedSave(3)}
            saving={saving}
          />
        )}

        {currentStep === 3 && (
          <StepThreeForm
            products={products.map(({ id, name, price, fileName }) => ({
              id,
              name,
              price,
              fileName,
            }))}
            onProductChange={handleProductChange}
            onProductFileChange={handleProductFileChange}
            onAddProduct={handleAddProduct}
            onRemoveProduct={handleRemoveProduct}
            onBack={() => updateStepParam(2)}
            onSubmitAll={handleFinalSubmit}
            saving={saving}
          />
        )}
      </div>
    </div>
  )
}
