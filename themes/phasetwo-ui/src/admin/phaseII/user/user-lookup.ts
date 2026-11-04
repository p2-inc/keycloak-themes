/**
 * Exact-match user lookup for the admin console.
 *
 * Keycloak's default `search` param runs a prefix LIKE over username, email,
 * first and last name. The name columns are wrapped in lower(), so no index
 * applies and every search reads the whole user table. On realms with
 * millions of users that is unusable, so every user search in phasetwo-ui
 * goes through these helpers instead, which only build indexed requests:
 *
 *   username / email   -> username=… / email=… with exact=true (equality on an indexed column)
 *   user ID            -> search=id:… (primary-key lookup)
 *   custom attribute   -> q=key:value with exact=true (equality, narrowed by attribute name)
 *
 * The `username:` / `email:` / `id:` search prefixes need Keycloak 26.7+.
 */

export type UserLookupField = "username" | "email" | "id";

export type UserLookupFilter = {
  /** "username", "email", "id", or a user attribute name. */
  field: string;
  value: string;
  /** Display name for attribute filters, from the user profile. */
  label?: string;
};

export type UserLookupParams = Record<string, string>;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const CORE_FIELDS = ["username", "email"];

export const isUuid = (value: string) => UUID_RE.test(value.trim());

export const isCoreField = (field: string) => CORE_FIELDS.includes(field);

export const splitTerms = (value: string) =>
  value.trim().split(/\s+/).filter(Boolean);

/** Guesses which field a pasted value belongs to. */
export function detectLookupField(value: string): UserLookupField {
  const v = value.trim();
  if (isUuid(v)) return "id";
  if (v.includes("@")) return "email";
  return "username";
}

/**
 * Quotes a `q` key or value when it contains characters that
 * SearchQueryUtils.getFields would otherwise split on.
 */
export function quoteQueryPart(part: string) {
  if (!/[\s"\\:]/.test(part)) return part;
  return `"${part.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

/**
 * Adds a filter to the active set. A field can only hold one value, so a new
 * value replaces the old one. An ID lookup can't be combined with anything
 * else, because the server ignores `q` and the other params when `search` is
 * set, so it replaces every other filter (and is replaced by any of them).
 */
export function addLookupFilter(
  filters: UserLookupFilter[],
  next: UserLookupFilter,
  multi = true,
): UserLookupFilter[] {
  const value = next.value.trim();
  if (!next.field || !value) return filters;
  const filter = { ...next, value };
  if (!multi || filter.field === "id") return [filter];
  return filters
    .filter((f) => f.field !== filter.field && f.field !== "id")
    .concat(filter);
}

/**
 * Builds the query params for GET /admin/realms/{realm}/users.
 * Returns undefined when there is nothing to look up, so callers can skip the
 * request instead of listing the realm.
 */
export function buildUserLookupParams(
  filters: UserLookupFilter[],
): UserLookupParams | undefined {
  const active = filters.filter((f) => f.field && f.value.trim());
  if (!active.length) return undefined;

  const id = active.find((f) => f.field === "id");
  if (id) return { search: `id:${splitTerms(id.value).join(" ")}` };

  const params: UserLookupParams = { exact: "true" };
  const attributes: string[] = [];
  for (const f of active) {
    const value = f.value.trim();
    if (isCoreField(f.field)) params[f.field] = value;
    else attributes.push(`${quoteQueryPart(f.field)}:${quoteQueryPart(value)}`);
  }
  if (attributes.length) params.q = attributes.join(" ");
  return params;
}

/**
 * Builds the `search` params for a typeahead picker, one per kind of term.
 * Each space-separated term becomes one indexed get-by-username/email/id on
 * the server, so a pasted list of usernames works. Returns an empty array for
 * empty input.
 */
export function buildUserPickerSearches(text: string): string[] {
  const byKind = new Map<UserLookupField, string[]>();
  for (const term of splitTerms(text)) {
    const kind = detectLookupField(term);
    byKind.set(kind, [...(byKind.get(kind) ?? []), term]);
  }
  return [...byKind].map(([kind, terms]) => `${kind}:${terms.join(" ")}`);
}
