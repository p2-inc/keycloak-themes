/**
 * Unit tests for the exact-match user lookup request builder.
 * Pure functions — no browser and no Keycloak needed.
 *
 * Run with: pnpm test:e2e --project unit
 */

import { test, expect } from "@playwright/test";
import {
  addLookupFilter,
  buildUserLookupParams,
  buildUserPickerSearches,
  detectLookupField,
  quoteQueryPart,
} from "../../src/admin/phaseII/user/user-lookup";

const ID = "8f3c2a1e-4bb2-4c1d-b6a1-535e5b85d792";

test.describe("detectLookupField", () => {
  test("treats a UUID as a user ID", () => {
    expect(detectLookupField(ID)).toBe("id");
    expect(detectLookupField(` ${ID.toUpperCase()} `)).toBe("id");
  });

  test("treats a value with @ as an email", () => {
    expect(detectLookupField("ada@example.test")).toBe("email");
  });

  test("falls back to username", () => {
    expect(detectLookupField("ada")).toBe("username");
    expect(detectLookupField("8f3c2a1e")).toBe("username");
  });
});

test.describe("buildUserLookupParams", () => {
  test("sends nothing when there are no filters", () => {
    expect(buildUserLookupParams([])).toBeUndefined();
    expect(buildUserLookupParams([{ field: "username", value: "  " }])).toBeUndefined();
  });

  test("never sends the prefix-matching search param for username or email", () => {
    const params = buildUserLookupParams([
      { field: "username", value: "ada" },
      { field: "email", value: "ada@example.test" },
    ]);
    expect(params).toEqual({
      exact: "true",
      username: "ada",
      email: "ada@example.test",
    });
    expect(params).not.toHaveProperty("search");
  });

  test("puts attributes in q with exact=true", () => {
    expect(
      buildUserLookupParams([
        { field: "plan", value: "team" },
        { field: "region", value: "eu" },
      ])
    ).toEqual({ exact: "true", q: "plan:team region:eu" });
  });

  test("combines username and attribute filters", () => {
    expect(
      buildUserLookupParams([
        { field: "username", value: "ada" },
        { field: "plan", value: "team" },
      ])
    ).toEqual({ exact: "true", username: "ada", q: "plan:team" });
  });

  test("quotes attribute keys and values the server would split on", () => {
    expect(
      buildUserLookupParams([{ field: "legacyId", value: "LG 10401" }])
    ).toEqual({ exact: "true", q: 'legacyId:"LG 10401"' });
  });

  test("uses the id: search prefix for user IDs", () => {
    expect(buildUserLookupParams([{ field: "id", value: ` ${ID} ` }])).toEqual({
      search: `id:${ID}`,
    });
  });

  test("trims values", () => {
    expect(
      buildUserLookupParams([{ field: "username", value: "  ada  " }])
    ).toEqual({ exact: "true", username: "ada" });
  });
});

test.describe("quoteQueryPart", () => {
  test("leaves plain values alone", () => {
    expect(quoteQueryPart("team")).toBe("team");
  });

  test("quotes and escapes", () => {
    expect(quoteQueryPart("a b")).toBe('"a b"');
    expect(quoteQueryPart("a:b")).toBe('"a:b"');
    expect(quoteQueryPart('say "hi"')).toBe('"say \\"hi\\""');
    expect(quoteQueryPart("back\\slash")).toBe('"back\\\\slash"');
  });
});

test.describe("addLookupFilter", () => {
  const username = { field: "username", value: "ada" };
  const plan = { field: "plan", value: "team" };

  test("adds filters for different fields", () => {
    expect(addLookupFilter([username], plan)).toEqual([username, plan]);
  });

  test("replaces the value of a field that is already filtered", () => {
    expect(
      addLookupFilter([username, plan], { field: "username", value: "bob" })
    ).toEqual([plan, { field: "username", value: "bob" }]);
  });

  test("an ID lookup replaces every other filter", () => {
    expect(addLookupFilter([username, plan], { field: "id", value: ID })).toEqual([
      { field: "id", value: ID },
    ]);
  });

  test("any other filter replaces an ID lookup", () => {
    expect(addLookupFilter([{ field: "id", value: ID }], plan)).toEqual([plan]);
  });

  test("keeps only the newest filter in single-filter mode", () => {
    expect(addLookupFilter([username], plan, false)).toEqual([plan]);
  });

  test("ignores empty values", () => {
    expect(addLookupFilter([username], { field: "plan", value: " " })).toEqual([
      username,
    ]);
  });
});

test.describe("buildUserPickerSearches", () => {
  test("returns nothing for empty input", () => {
    expect(buildUserPickerSearches("   ")).toEqual([]);
  });

  test("looks up several usernames in one request", () => {
    expect(buildUserPickerSearches("ada  bob")).toEqual(["username:ada bob"]);
  });

  test("groups mixed input by kind", () => {
    expect(buildUserPickerSearches(`ada ada@example.test ${ID} bob`)).toEqual([
      "username:ada bob",
      "email:ada@example.test",
      `id:${ID}`,
    ]);
  });
});
