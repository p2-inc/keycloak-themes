import { generateEncodedPath } from "../../../utils/generateEncodedPath";
import type { AppRouteObject } from "../../../routes";

import { lazy } from "react";
import { Path } from "react-router-dom";

export type OrgTab =
  | "settings"
  | "domains"
  | "attributes"
  | "members"
  | "invitations"
  | "roles"
  | "identityproviders"
  | "scim";

export type OrgParams = {
  realm: string;
  orgId: string;
  tab: OrgTab;
};

const OrgDetails = lazy(() => import("../OrgDetails"));

export const OrgRoute: AppRouteObject = {
  path: "/:realm/ext-organizations/:orgId/:tab",
  element: <OrgDetails />,
  breadcrumb: (t) => t("orgDetails"),
  handle: {
    access: "view-clients",
  },
};

export const toOrg = (params: OrgParams): Partial<Path> => ({
  pathname: generateEncodedPath(OrgRoute.path, params),
});
