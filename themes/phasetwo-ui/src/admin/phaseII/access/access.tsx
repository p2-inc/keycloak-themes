import type {
  AccessType,
  AccessTypeFunc,
} from "@keycloak/keycloak-admin-client/lib/defs/whoAmIRepresentation";

/**
 * Realm-management roles added by the keycloak-orgs extension. They are not
 * part of the upstream `AccessType` union, so they are declared here.
 */
export type OrganizationAccessType =
  | "view-organizations"
  | "manage-organizations";

export type ExtendedAccessChecker = {
  hasAll: (...types: ExtendedAccessType[]) => boolean;
  hasAny: (...types: ExtendedAccessType[]) => boolean;
};

/**
 * Used in place of a role name when access needs "any of these roles"
 * semantics, which the array form cannot express because {@link AuthWall}
 * evaluates it with AND. `label` is what gets shown in the
 * {@link ForbiddenSection}, since a function has no meaningful name.
 */
export type ExtendedAccessTypeFunc = ((
  accessChecker: ExtendedAccessChecker,
) => boolean) & { label?: string };

/**
 * The upstream `AccessType`, plus the organization roles. The upstream
 * function form is replaced by {@link ExtendedAccessTypeFunc} so that
 * predicates can reference the organization roles too.
 */
export type ExtendedAccessType =
  | Exclude<AccessType, AccessTypeFunc>
  | OrganizationAccessType
  | ExtendedAccessTypeFunc;

/** Either of these grants access to the organizations admin UI. */
export const ORGANIZATION_ROLES: OrganizationAccessType[] = [
  "view-organizations",
  "manage-organizations",
];

/**
 * Access guard for the organizations section.
 *
 * The organizations UI only calls the keycloak-orgs endpoints under
 * `/realms/{realm}/orgs`, which are authorized server-side with
 * `view-organizations` (reads) and `manage-organizations` (writes). It never
 * reads the clients API, so it must not require `view-clients`/`query-clients`:
 * those also expose every client secret in the realm through
 * `/admin/realms/{realm}/clients/{id}/client-secret`.
 *
 * `manage-organizations` is not a composite of `view-organizations`, so both
 * have to be accepted here — and this must stay in sync with the left-nav
 * check in `phaseII/navigation/extensions.tsx`, because `LeftNav` hides any
 * item whose route access fails.
 */
export const hasOrganizationsAccess: ExtendedAccessTypeFunc = ({ hasAny }) =>
  hasAny(...ORGANIZATION_ROLES);
hasOrganizationsAccess.label = ORGANIZATION_ROLES.join(" or ");

/**
 * Human readable name for an access requirement. Predicates report their
 * `label`, if they set one; anything else has no name to report.
 */
export const describeAccessType = (type: ExtendedAccessType): string =>
  typeof type === "function" ? (type.label ?? "") : type;
