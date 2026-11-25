export const MANITTO_MAKER_MIN_MEMBERS = 3
export const MANITTO_MAKER_MAX_MEMBERS = 50

export function isManittoMakerCode(value: string): boolean {
  return /^[A-Za-z0-9_-]{12}$/.test(value)
}

export function normalizeManittoMakerName(value: string): string {
  return value.trim().replace(/\s+/g, ' ')
}

export function isManittoMakerName(value: string): boolean {
  return value.length >= 1 && value.length <= 24 && !/[\p{Cc}\p{Cf}]/u.test(value)
}

export function isManittoMakerTitle(value: string): boolean {
  return value.length >= 2 && value.length <= 60 && !/[\p{Cc}\p{Cf}]/u.test(value)
}

export function isManittoMakerCapacity(value: number): boolean {
  return Number.isInteger(value) && value >= MANITTO_MAKER_MIN_MEMBERS && value <= MANITTO_MAKER_MAX_MEMBERS
}
