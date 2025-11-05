"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Trash2, UploadCloud } from "lucide-react"

type Product = {
  id: string
  name: string
  price: string
  fileName: string | null
}

type StepThreeFormProps = {
  products: Product[]
  onProductChange: (id: string, field: "name" | "price", value: string) => void
  onProductFileChange: (id: string, file: File | null) => void
  onAddProduct: () => void
  onRemoveProduct: (id: string) => void
  onBack: () => void
  onSubmitAll: () => void
  saving: boolean
}

export function StepThreeForm({
  products,
  onProductChange,
  onProductFileChange,
  onAddProduct,
  onRemoveProduct,
  onBack,
  onSubmitAll,
  saving,
}: StepThreeFormProps) {
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmitAll()
  }

  return (
    <Card className="border-emerald-100 bg-white/90 shadow-xl">
      <CardHeader>
        <CardTitle className="text-emerald-800">ข้อมูลสินค้า</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1.5fr)_auto] items-center gap-3 text-sm font-semibold text-emerald-700">
            <span>ชื่อสินค้า</span>
            <span>ราคา</span>
            <span>ภาพสินค้า</span>
            <span className="sr-only">actions</span>
          </div>

          <div className="space-y-3">
            {products.map((product) => (
              <div
                key={product.id}
                className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1.5fr)_auto] items-center gap-3"
              >
                <Input
                  placeholder="ชื่อสินค้า"
                  value={product.name}
                  onChange={(event) => onProductChange(product.id, "name", event.target.value)}
                  required
                />
                <Input
                  placeholder="ราคา (บาท)"
                  value={product.price}
                  onChange={(event) => onProductChange(product.id, "price", event.target.value)}
                  inputMode="decimal"
                  required
                />
                <label
                  htmlFor={`product-file-${product.id}`}
                  className="flex cursor-pointer items-center justify-between rounded-lg border border-dashed border-emerald-200 bg-emerald-50/60 px-3 py-2 text-sm text-emerald-700 hover:bg-emerald-100"
                >
                  <span className="truncate">
                    {product.fileName ?? "อัปโหลดไฟล์"}
                  </span>
                  <UploadCloud className="h-4 w-4 shrink-0" />
                </label>
                <Input
                  id={`product-file-${product.id}`}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => onProductFileChange(product.id, event.target.files?.[0] ?? null)}
                />

                <Button
                  type="button"
                  variant="ghost"
                  className="text-red-500 hover:bg-red-50"
                  onClick={() => onRemoveProduct(product.id)}
                  disabled={products.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full border-dashed border-emerald-200 text-emerald-700 hover:bg-emerald-50"
            onClick={onAddProduct}
          >
            <Plus className="h-4 w-4" />
            เพิ่มสินค้า
          </Button>
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
            onClick={onBack}
          >
            ย้อนกลับ
          </Button>
          <Button
            type="submit"
            className="bg-emerald-600 text-white hover:bg-emerald-700"
            disabled={saving}
          >
            {saving ? "กำลังบันทึก..." : "บันทึกแบบร่าง"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
