/**
 * Fixtures for the exact-match user lookup tests (api/user-lookup.spec.ts,
 * admin/user-search.spec.ts). The two users share a username prefix on
 * purpose, so a test can tell an exact match from a prefix match.
 */

import {
  ensureGroup,
  ensureUser,
  ensureUserProfileAttribute,
} from "./api";

export const LOOKUP_ATTRIBUTE = { name: "legacyId", displayName: "Legacy ID" };

export const LOOKUP_ADA = {
  username: "lookup-ada",
  email: "ada.lookup@example.test",
  firstName: "Ada",
  lastName: "Lookup",
  // A value with a space, which has to be quoted in the `q` param.
  attributes: { legacyId: ["LG 10401"] },
};

export const LOOKUP_ADAM = {
  username: "lookup-adam",
  email: "adam.lookup@example.test",
  firstName: "Adam",
  lastName: "Lookup",
  attributes: { legacyId: ["LG 10402"] },
};

export const LOOKUP_GROUP = "lookup-group";

export async function ensureLookupFixtures(token: string) {
  await ensureUserProfileAttribute(
    token,
    LOOKUP_ATTRIBUTE.name,
    LOOKUP_ATTRIBUTE.displayName
  );
  const adaId = await ensureUser(token, LOOKUP_ADA);
  const adamId = await ensureUser(token, LOOKUP_ADAM);
  const groupId = await ensureGroup(token, LOOKUP_GROUP);
  return { adaId, adamId, groupId };
}
