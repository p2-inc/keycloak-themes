import type { AccessType } from "@keycloak/keycloak-admin-client/lib/defs/whoAmIRepresentation";

export type ExtendedAccessType =
  | AccessType
  | "view-organizations"
  | "manage-organizations";
