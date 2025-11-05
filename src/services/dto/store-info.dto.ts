type StoreType = {
  "Nisit":  string
  "Club":   string
}

export type CreateStoreRequestDto = {
  storeName: string;
  type: StoreType;
  memberGmails: string[]
}