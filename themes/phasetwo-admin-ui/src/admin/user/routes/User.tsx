/**
 * This file has been claimed for ownership from @keycloakify/keycloak-admin-ui version 260502.0.0.
 * To relinquish ownership and restore this file to its original content, run the following command:
 * 
 * $ npx keycloakify own --path "admin/user/routes/User.tsx" --revert
 */

/* eslint-disable */

// @ts-nocheck

import { lazy } from "react";
import type { Path } from "react-router-dom";
import { generateEncodedPath } from "../../utils/generateEncodedPath";
import type { AppRouteObject } from "../../routes";

export type UserTab =
  | "settings"
  | "groups"
  | "organizations"
  | "consents"
  | "attributes"
  | "sessions"
  | "credentials"
  | "role-mapping"
  | "identity-provider-links"
  | "events"
  | "user-orgs";

export type UserParams = {
  realm: string;
  id: string;
  tab: UserTab;
};

const EditUser = lazy(() => import("../EditUser"));

export const UserRoute: AppRouteObject = {
  path: "/:realm/users/:id/:tab",
  element: <EditUser />,
  breadcrumb: (t) => t("userDetails"),
  handle: {
    access: "query-users",
  },
};

export const toUser = (params: UserParams): Partial<Path> => ({
  pathname: generateEncodedPath(UserRoute.path, params),
});
