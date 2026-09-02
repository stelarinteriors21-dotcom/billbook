import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function serializeData<T>(data: T): T {
  if (data === null || data === undefined) return data
  if (typeof data === "object" && ("d" in (data as any) && "e" in (data as any) && "s" in (data as any) || (data as any)._isDecimal || (data as any).constructor?.name === "Decimal")) {
    return Number(data) as any
  }
  if (data instanceof Date) {
    return data.toISOString() as any
  }
  if (Array.isArray(data)) {
    return data.map(serializeData) as any
  }
  if (typeof data === "object") {
    const res: any = {}
    for (const key of Object.keys(data)) {
      const val = (data as any)[key]
      if (val && typeof val === "object" && (("d" in val && "e" in val && "s" in val) || val._isDecimal || val.constructor?.name === "Decimal")) {
        res[key] = Number(val)
      } else if (val instanceof Date) {
        res[key] = val.toISOString()
      } else if (typeof val === "object") {
        res[key] = serializeData(val)
      } else {
        res[key] = val
      }
    }
    return res
  }
  return data
}
