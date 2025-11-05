type StoreType = {
  "Nisit":  string
  "Club":   string
}

type storeState = {
  // ขั้นตอนการสร้างร้าน
  "CreateStore":    string
  "StoreDetails":   string
  "ProductDetails": string
  "Submitted":      string

  // หลังจากส่งแล้ว เข้าสู่สถานะหลัก
  "Pending":        string // รอจับฉลาก
  "Success":        string // ได้รับเลือก
  "Rejected":       string // ไม่ได้รับเลือก (ถ้ามี)
}


export type CreateStoreRequestDto = {
  storeName: string;
  type: StoreType;
  memberGmails: string[]
}

export type StoreStatusResponseDto = {
  id: number;
  storeName: string;
  type: StoreType;
  state: storeState;
}
