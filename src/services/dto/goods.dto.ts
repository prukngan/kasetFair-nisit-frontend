export type GoodsType = "Food" | "NonFood"

export type GoodsResponseDto = {
  id: string
  name: string
  type: GoodsType
  price: string
  storeId: number
  goodMediaId: string | null
  createdAt: string
  updatedAt: string
}

export type CreateGoodRequestDto = {
  name: string
  type: GoodsType
  price: number
  goodMediaId?: string | null
}

export type UpdateGoodRequestDto = Partial<CreateGoodRequestDto>
