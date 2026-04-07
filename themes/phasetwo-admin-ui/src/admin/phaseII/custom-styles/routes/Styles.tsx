import { lazy } from "react";
import type { AppRouteObject } from "../../../routes";
import type { Path } from "react-router-dom";
import { generateEncodedPath } from "../../../utils/generateEncodedPath";

export type StylesTab = "general" | "login" | "email" | "portal";

export type StylesParams = {
  realm: string;
  tab?: StylesTab;
};

const StylesSection = lazy(() => import("../StylesSection"));

export const StylesRoute: AppRouteObject = {
  path: "/:realm/ext-styles",
  element: <StylesSection />,
  handle: {
    access: "query-clients",
  },
  breadcrumb: (t) => t("styles"),
};

export const StylesRouteWithTab: AppRouteObject = {
  ...StylesRoute,
  path: "/:realm/ext-styles/:tab",
};

export const toStyles = (params: StylesParams): Partial<Path> => {
  const path = params.tab ? StylesRouteWithTab.path : StylesRoute.path;

  return {
    pathname: generateEncodedPath(path, params),
  };
};
