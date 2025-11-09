export type StoreType = "Nisit" | "Club"

export type StoreState = "CreateStore" | "ClubInfo" | "StoreDetails" | "ProductDetails" | "Submitted" | "Pending"

export type ClubApplicationDto = {
  organizationName: string
  presidentFirstName: string
  presidentLastName: string
  presidentNisitId: string
  applicationFileName?: string | null
}

export type CreateStoreRequestDto = {
  storeName: string
  type: StoreType
  memberGmails: string[]
  clubApplication?: ClubApplicationDto
}

export type CreateStoreResponseDto = {
  id: number
  storeName: string
  type: StoreType
  state: StoreState
  missingProfileEmails?: string[]
  createdAt?: string
  updatedAt?: string
}

export type StoreStatusRequestDto = {
  id: number
}

export type StoreStatusResponseDto = {
  id: number
  storeName: string
  type: StoreType
  state: StoreState
}

export type StoreValidationChecklistItemDto = {
  key?: string
  label?: string
  message?: string | null
  description?: string | null
  isValid?: boolean
  ok?: boolean
}

export type StorePendingValidationResponseDto = {
  storeId: number
  type: StoreType
  state: StoreState
  isValid: boolean
  checklist: StoreValidationChecklistItemDto[]
}
