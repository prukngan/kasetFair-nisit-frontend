"use client"

import { useCallback, useEffect, useState } from "react"
import type { StoreWizardCore, StoreProgress } from "./store-wizard.core"

export type ProductFormState = {
  id: string
  name: string
  price: string
  file: File | null
  fileName: string | null
}

const createProduct = (): ProductFormState => ({
  id:
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `product-${Math.random().toString(16).slice(2)}`,
  name: "",
  price: "",
  file: null,
  fileName: null,
})

export type UseProductStepResult = {
  products: ProductFormState[]
  isSubmitting: boolean
  handleProductChange: (id: string, field: "name" | "price", value: string) => void
  handleProductFileChange: (id: string, file: File | null) => void
  addProduct: () => void
  removeProduct: (id: string) => void
  submitAll: (context?: Record<string, unknown>) => Promise<void>
}

export function useProductStep(core: StoreWizardCore): UseProductStepResult {
  const [products, setProducts] = useState<ProductFormState[]>([
    createProduct(),
    createProduct(),
    createProduct(),
  ])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const resetProducts = useCallback(() => {
    setProducts([createProduct(), createProduct(), createProduct()])
    setIsSubmitting(false)
  }, [])

  useEffect(() => {
    resetProducts()
  }, [resetProducts, core.resetSignal])

  useEffect(() => {
    const snapshot = core.storeStatus as StoreProgress | null
    if (!Array.isArray(snapshot?.products)) return

    const mapped: ProductFormState[] = snapshot!.products!.map((product, index) => ({
      id: product.id?.toString?.() ?? `server-${index}`,
      name: product.name ?? "",
      price: product.price != null ? String(product.price) : "",
      file: null,
      fileName: product.fileName ?? product.imageName ?? null,
    }))

    setProducts(mapped.length ? mapped : [createProduct(), createProduct(), createProduct()])
  }, [core.storeStatus])

  const handleProductChange = useCallback(
    (id: string, field: "name" | "price", value: string) => {
      setProducts((prev) => prev.map((product) => (product.id === id ? { ...product, [field]: value } : product)))
    },
    []
  )

  const handleProductFileChange = useCallback((id: string, file: File | null) => {
    setProducts((prev) =>
      prev.map((product) =>
        product.id === id
          ? {
              ...product,
              file,
              fileName: file ? file.name : null,
            }
          : product
      )
    )
  }, [])

  const addProduct = useCallback(() => {
    setProducts((prev) => [...prev, createProduct()])
  }, [])

  const removeProduct = useCallback((id: string) => {
    setProducts((prev) => (prev.length === 1 ? prev : prev.filter((product) => product.id !== id)))
  }, [])

  const submitAll = useCallback(
    async (context?: Record<string, unknown>) => {
      setIsSubmitting(true)
      await new Promise((resolve) => setTimeout(resolve, 400))
      console.log("Store draft submitted", context ?? { products })
      setIsSubmitting(false)
    },
    [products]
  )

  return {
    products,
    isSubmitting,
    handleProductChange,
    handleProductFileChange,
    addProduct,
    removeProduct,
    submitAll,
  }
}
