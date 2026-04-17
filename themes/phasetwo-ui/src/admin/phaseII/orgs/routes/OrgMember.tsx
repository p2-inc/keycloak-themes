import { generateEncodedPath } from "../../../utils/generateEncodedPath";
import type { AppRouteObject } from "../../../routes";

import { lazy } from "react";
import { Path } from "react-router-dom";

export type OrgMemberTab = "roles" | "attributes";

export type OrgMemberParams = {
  realm: string;
  orgId: string;
  userId: string;
  tab: OrgMemberTab;
};

const OrgMemberDetails = lazy(() => import("../OrgMemberDetails"));

export const OrgMemberRoute: AppRouteObject = {
  path: "/:realm/ext-organizations/:orgId/members/:userId/:tab",
  element: <OrgMemberDetails />,
  breadcrumb: (t) => t("orgMemberDetails"),
  handle: {
    access: "view-clients",
  },
};

export const toOrgMember = (params: OrgMemberParams): Partial<Path> => ({
  pathname: generateEncodedPath(OrgMemberRoute.path, params),
});
