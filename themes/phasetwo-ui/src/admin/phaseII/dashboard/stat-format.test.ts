import { describe, expect, it } from "vitest";

import { exactStatValue, formatStatValue } from "./stat-format";

const exact = (n: number) => n.toLocaleString();
const compact = (n: number) =>
  new Intl.NumberFormat(undefined, {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);

describe("formatStatValue", () => {
  it("shows a dash while the value is loading", () => {
    expect(formatStatValue(null)).toBe("—");
  });

  it("keeps small counts exact", () => {
    expect(formatStatValue(30)).toBe("30");
    expect(formatStatValue(9_999)).toBe(exact(9_999));
  });

  it("abbreviates large counts so the card width stays bounded", () => {
    expect(formatStatValue(10_000)).toBe(compact(10_000));
    expect(formatStatValue(406_410)).toBe(compact(406_410));
    expect(formatStatValue(12_345_678)).toBe(compact(12_345_678));
    expect(formatStatValue(12_345_678).length).toBeLessThanOrEqual(6);
  });

  it("locale-formats a capped value before marking it", () => {
    expect(formatStatValue(100, true)).toBe("100+");
    expect(formatStatValue(1_000, true)).toBe(`${exact(1_000)}+`);
  });
});

describe("exactStatValue", () => {
  it("is undefined while loading", () => {
    expect(exactStatValue(null)).toBeUndefined();
  });

  it("returns the full value even when the display is abbreviated", () => {
    expect(exactStatValue(406_410)).toBe(exact(406_410));
    expect(exactStatValue(100, true)).toBe("100+");
  });
});
