import Decimal from "break_infinity.js";

export const SAVE_VERSION = 1;
const DECIMAL_TAG = "__island_decimal__";

function encode(value: unknown): unknown {
  if (value instanceof Decimal) return { [DECIMAL_TAG]: value.toString() };
  if (Array.isArray(value)) return value.map(encode);
  if (value !== null && typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) {
      if (typeof item !== "function") result[key] = encode(item);
    }
    return result;
  }
  return value;
}

function decode(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(decode);
  if (value !== null && typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (typeof record[DECIMAL_TAG] === "string") return new Decimal(record[DECIMAL_TAG]);
    const result: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(record)) result[key] = decode(item);
    return result;
  }
  return value;
}

export const serializeSave = (value: unknown): string => JSON.stringify(encode(value));
export const deserializeSave = (value: string): unknown => decode(JSON.parse(value) as unknown);

export const migrateSave = (value: unknown, _version: number): unknown => value;
