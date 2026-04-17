/**
 * This file has been claimed for ownership from @keycloakify/keycloak-admin-ui version 260502.0.0.
 * To relinquish ownership and restore this file to its original content, run the following command:
 * 
 * $ npx keycloakify own --path "admin/realm-settings/routes/RealmSettings.tsx" --revert
 */

/* eslint-disable */

// @ts-nocheck

import { lazy } from "react";
import type { Path } from "react-router-dom";
import { generateEncodedPath } from "../../utils/generateEncodedPath";
import type { AppRouteObject } from "../../routes";

export type RealmSettingsTab =
  | "general"
  | "login"
  | "email"
  | "themes"
  | "keys"
  | "events"
  | "localization"
  | "security-defenses"
  | "sessions"
  | "tokens"
  | "client-policies"
  | "user-profile"
  | "user-registration"
  | "attributes"; // Phase Two Realm Settings Addition

export type RealmSettingsParams = {
  realm: string;
  tab?: RealmSettingsTab;
};

const RealmSettingsSection = lazy(() => import("../RealmSettingsSection"));

export const RealmSettingsRoute: AppRouteObject = {
  path: "/:realm/realm-settings",
  element: <RealmSettingsSection />,
  breadcrumb: (t) => t("realmSettings"),
  handle: {
    access: "view-realm",
  },
};

export const RealmSettingsRouteWithTab: AppRouteObject = {
  ...RealmSettingsRoute,
  path: "/:realm/realm-settings/:tab",
};

export const toRealmSettings = (params: RealmSettingsParams): Partial<Path> => {
  const path = params.tab
    ? RealmSettingsRouteWithTab.path
    : RealmSettingsRoute.path;

  return {
    pathname: generateEncodedPath(path, params),
  };
};
