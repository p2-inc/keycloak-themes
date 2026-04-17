import { describe, expect, it } from "vitest";

import {
  getPaginatedItemCount,
  getPaginationFirstOnPerPageSelect,
  getPaginationPage,
} from "./pagination-utils";

describe("pagination utils", () => {
  it("converts an item offset into a 1-based page number", () => {
    expect(getPaginationPage(0, 10)).toBe(1);
    expect(getPaginationPage(10, 10)).toBe(2);
    expect(getPaginationPage(21, 10)).toBe(3);
  });

  it("keeps the real item offset when changing the page size", () => {
    expect(getPaginationFirstOnPerPageSelect(20, 2, 20)).toBe(20);
    expect(getPaginationFirstOnPerPageSelect(50, 3)).toBe(100);
  });

  it("only exposes an exact total on the last page", () => {
    expect(getPaginatedItemCount(0, 10, 11)).toBeUndefined();
    expect(getPaginatedItemCount(20, 10, 5)).toBe(25);
  });
});
