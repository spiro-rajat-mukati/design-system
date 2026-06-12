/** Strip the "px" unit from a token value string and return a number. */
export function px(value: string): number {
  if (value === "0" || value === "none") return 0;
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}
