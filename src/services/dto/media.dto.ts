export enum MediaPurpose {
  NISIT_CARD = "NISIT_CARD",
  STORE_LAYOUT = "STORE_LAYOUT",
  STORE_GOODS = "STORE_GOODS",
  CLUB_APPLICATION = "CLUB_APPLICATION",
  OTHER = "OTHER",
}

export type MediaRequestDto = {
  purpose: MediaPurpose
  file: File
}

export type MediaResponseDto = {
  id: string
}
