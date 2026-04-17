/**
 * This file has been claimed for ownership from @keycloakify/keycloak-admin-ui version 260502.0.0.
 * To relinquish ownership and restore this file to its original content, run the following command:
 *
 * $ npx keycloakify own --path "admin/context/access/Access.tsx" --revert
 */

/* eslint-disable */

// @ts-nocheck

import type { AccessType } from "@keycloak/keycloak-admin-client/lib/defs/whoAmIRepresentation";
import {
  createNamedContext,
  useRequiredContext,
} from "../../../shared/keycloak-ui-shared";
import { PropsWithChildren } from "react";
import { useRealm } from "../../context/realm-context/RealmContext";
import { useWhoAmI } from "../../context/whoami/WhoAmI";

import { ExtendedAccessType } from "../../phaseII/access/access";

type AccessContextProps = {
  hasAccess: (...types: ExtendedAccessType[]) => boolean;
  hasSomeAccess: (...types: ExtendedAccessType[]) => boolean;
};

export const AccessContext = createNamedContext<AccessContextProps | undefined>(
  "AccessContext",
  undefined,
);

export const useAccess = () => useRequiredContext(AccessContext);

export const AccessContextProvider = ({ children }: PropsWithChildren) => {
  const { whoAmI } = useWhoAmI();
  const { realm } = useRealm();
  const access = whoAmI.realm_access[realm] ?? [];

  const hasAccess = (...types: ExtendedAccessType[]): boolean => {
    return types.every(
      (type) =>
        type === "anyone" ||
        (typeof type === "function" &&
          type({ hasAll: hasAccess, hasAny: hasSomeAccess })) ||
        access.includes(type),
    );
  };

  const hasSomeAccess = (...types: ExtendedAccessType[]): boolean => {
    return types.some(
      (type) =>
        type === "anyone" ||
        (typeof type === "function" &&
          type({ hasAll: hasAccess, hasAny: hasSomeAccess })) ||
        access.includes(type),
    );
  };

  return (
    <AccessContext.Provider value={{ hasAccess, hasSomeAccess }}>
      {children}
    </AccessContext.Provider>
  );
};
