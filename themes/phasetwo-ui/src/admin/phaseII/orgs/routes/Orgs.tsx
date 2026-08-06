import { lazy } from "react";
import { Path } from "react-router-dom";
import type { AppRouteObject } from "../../../routes";
import { generateEncodedPath } from "../../../utils/generateEncodedPath";
import { hasOrganizationsAccess } from "../../access/access";

export type OrgsParams = {
  realm: string;
};

const OrgsSection = lazy(() => import("../OrgsSection"));

export const OrgsRoute: AppRouteObject = {
  path: "/:realm/ext-organizations",
  element: <OrgsSection />,
  breadcrumb: (t) => t("orgList"),
  handle: {
    access: hasOrganizationsAccess,
  },
};

export const toOrgs = (params: OrgsParams): Partial<Path> => ({
  pathname: generateEncodedPath(OrgsRoute.path, params),
});
