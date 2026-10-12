// Below this a full count still fits a stat card ("9,876"); at or above it the
// count is abbreviated ("406K") so its width stays bounded however large a
// realm grows. The exact value is always available via exactStatValue.
export const COMPACT_THRESHOLD = 10_000;

const compactFormatter = new Intl.NumberFormat(undefined, {
  notation: "compact",
  maximumFractionDigits: 1,
});

/** Display text for a stat card number: "—" while loading, compact when large. */
export function formatStatValue(
  value: number | null,
  capped?: boolean,
): string {
  if (value === null) return "—";
  const text =
    value >= COMPACT_THRESHOLD
      ? compactFormatter.format(value)
      : value.toLocaleString();
  return capped ? `${text}+` : text;
}

/** The unabbreviated value, for a tooltip and screen readers. */
export function exactStatValue(
  value: number | null,
  capped?: boolean,
): string | undefined {
  if (value === null) return undefined;
  const text = value.toLocaleString();
  return capped ? `${text}+` : text;
}
