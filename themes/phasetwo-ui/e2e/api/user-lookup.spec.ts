/**
 * API-level tests for the exact-match user lookup.
 *
 * The phasetwo-ui user search only sends requests built by
 * src/admin/phaseII/user/user-lookup.ts. These tests send those same requests
 * to a real Keycloak and check that the server treats them as exact,
 * case-insensitive matches, so a Keycloak upgrade that changes the semantics
 * fails here instead of in a customer's admin console.
 *
 * Run with: pnpm test:e2e
 */

import { test, expect } from "@playwright/test";
import { getAdminToken, KC_BASE, KC_REALM, searchUsers } from "../helpers/api";
import {
  ensureLookupFixtures,
  LOOKUP_ADA,
  LOOKUP_ADAM,
} from "../helpers/user-lookup-fixtures";
import {
  buildUserLookupParams,
  buildUserPickerSearches,
  type UserLookupFilter,
} from "../../src/admin/phaseII/user/user-lookup";

let token: string;
let adaId: string;

test.beforeAll(async () => {
  token = await getAdminToken();
  ({ adaId } = await ensureLookupFixtures(token));
});

const lookup = async (filters: UserLookupFilter[]) => {
  const users = await searchUsers(token, buildUserLookupParams(filters)!);
  return users.map((u) => u.username).sort();
};

test("the default prefix search matches both fixture users (why it was replaced)", async () => {
  const users = await searchUsers(token, { search: LOOKUP_ADA.username });
  expect(users.map((u) => u.username).sort()).toEqual([
    LOOKUP_ADA.username,
    LOOKUP_ADAM.username,
  ]);
});

test("username lookup is exact", async () => {
  expect(await lookup([{ field: "username", value: LOOKUP_ADA.username }])).toEqual([
    LOOKUP_ADA.username,
  ]);
});

test("username lookup ignores case", async () => {
  expect(
    await lookup([{ field: "username", value: LOOKUP_ADA.username.toUpperCase() }])
  ).toEqual([LOOKUP_ADA.username]);
});

test("a partial username matches nothing", async () => {
  expect(await lookup([{ field: "username", value: "lookup-ad" }])).toEqual([]);
});

test("email lookup is exact", async () => {
  expect(await lookup([{ field: "email", value: LOOKUP_ADAM.email }])).toEqual([
    LOOKUP_ADAM.username,
  ]);
  expect(await lookup([{ field: "email", value: "lookup@example.test" }])).toEqual([]);
});

test("user ID lookup", async () => {
  expect(await lookup([{ field: "id", value: adaId }])).toEqual([LOOKUP_ADA.username]);
});

test("attribute lookup is exact, ignores case, and handles spaces", async () => {
  expect(await lookup([{ field: "legacyId", value: "lg 10401" }])).toEqual([
    LOOKUP_ADA.username,
  ]);
  expect(await lookup([{ field: "legacyId", value: "LG 104" }])).toEqual([]);
});

test("filters combine with AND", async () => {
  expect(
    await lookup([
      { field: "username", value: LOOKUP_ADA.username },
      { field: "legacyId", value: "LG 10401" },
    ])
  ).toEqual([LOOKUP_ADA.username]);
  expect(
    await lookup([
      { field: "username", value: LOOKUP_ADA.username },
      { field: "legacyId", value: "LG 10402" },
    ])
  ).toEqual([]);
});

test("the Users page endpoint (ui-ext/brute-force-user) accepts the same params", async () => {
  const qs = new URLSearchParams(
    buildUserLookupParams([{ field: "username", value: LOOKUP_ADA.username }])
  );
  const res = await fetch(
    `${KC_BASE}/admin/realms/${KC_REALM}/ui-ext/brute-force-user?${qs}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  expect(res.ok).toBe(true);
  const users = (await res.json()) as Array<{ username: string }>;
  expect(users.map((u) => u.username)).toEqual([LOOKUP_ADA.username]);
});

test("picker lookups find several exact values, of mixed kinds", async () => {
  const results = await Promise.all(
    buildUserPickerSearches(
      `${LOOKUP_ADA.username} ${LOOKUP_ADAM.email} lookup-ad`
    ).map((search) => searchUsers(token, { search, max: "20" }))
  );
  expect(results.flat().map((u) => u.username).sort()).toEqual([
    LOOKUP_ADA.username,
    LOOKUP_ADAM.username,
  ]);
});
