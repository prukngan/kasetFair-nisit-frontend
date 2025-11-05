"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { UploadCloud } from "lucide-react"

type StepTwoFormProps = {
  layoutDescription: string
  layoutFileName: string | null
  onDescriptionChange: (value: string) => void
  onFileChange: (file: File | null) => void
  onBack: () => void
  onNext: () => void
  saving: boolean
}

export function StepTwoForm({
  layoutDescription,
  layoutFileName,
  onDescriptionChange,
  onFileChange,
  onBack,
  onNext,
  saving,
}: StepTwoFormProps) {
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onNext()
  }

  return (
    <Card className="border-emerald-100 bg-white/90 shadow-xl">
      <CardHeader>
        <CardTitle className="text-emerald-800">รายละเอียดร้านค้า</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="layoutDescription">รูปการจัดการพื้นที่บูธ (ตัวอย่าง)</Label>
            <Textarea
              id="layoutDescription"
              rows={6}
              placeholder="อธิบายโครงร่างพื้นที่บูธ เช่น ตำแหน่งสินค้า เคาน์เตอร์ หรือลูกเล่นสำหรับผู้ชม"
              value={layoutDescription}
              onChange={(event) => onDescriptionChange(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="layoutFile">อัปโหลดไฟล์รูปแบบบูธ</Label>
            <label
              htmlFor="layoutFile"
              className="flex w-full cursor-pointer items-center justify-between rounded-lg border border-dashed border-emerald-200 bg-emerald-50/60 px-4 py-3 text-sm text-emerald-700 hover:bg-emerald-100"
            >
              <span>{layoutFileName ?? "เลือกไฟล์ .pdf หรือ .png"}</span>
              <UploadCloud className="h-4 w-4" />
            </label>
            <Input
              id="layoutFile"
              type="file"
              accept=".png,.jpg,.jpeg,.pdf"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null
                onFileChange(file)
              }}
            />
            <p className="text-xs text-emerald-600">
              แนบไฟล์สำหรับการนำเสนอรูปแบบพื้นที่ ไม่เกิน 10 MB
            </p>
          </div>
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
            {saving ? "กำลังบันทึก..." : "บันทึกและไปขั้นถัดไป"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
