import Decimal from "break_infinity.js";

const SUFFIXES = ["", "K", "M", "B", "T", "aa", "ab", "ac", "ad", "ae", "af", "ag", "ah", "ai"];

export function formatNumber(value: Decimal): string {
  if (value.isNaN()) return "0";
  if (value.abs().lessThan(1_000_000)) return value.toFixed(2).replace(/\.?0+$/, "");
  const exponent = Math.max(0, Math.floor(value.abs().log10() / 3));
  const suffix = SUFFIXES[exponent] ?? `e${exponent * 3}`;
  return `${value.div(new Decimal(1000).pow(exponent)).toFixed(2)}${suffix}`;
}