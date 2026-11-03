import Decimal from "break_infinity.js";

export const SAVE_VERSION = 1;
const TAG = "__island_decimal__";

function encode(value: unknown): unknown {
  if (value instanceof Decimal) return { [TAG]: value.toString() };
  if (Array.isArray(value)) return value.map(encode);
  if (value && typeof value === "object") {
    const output: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value)) {
      if (typeof entry !== "function") output[key] = encode(entry);
    }
    return output;
  }
  return value;
}

function decode(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(decode);
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (typeof record[TAG] === "string") return new Decimal(record[TAG]);
    const output: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(record)) output[key] = decode(entry);
    return output;
  }
  return value;
}

export const serializeSave = (value: unknown): string => JSON.stringify(encode(value));
export const deserializeSave = (value: string): unknown => decode(JSON.parse(value) as unknown);

/** 版本迁移入口；未知旧版本安全地合并到当前默认状态。 */
export const migrateSave = (value: unknown, _version: number): unknown => value;