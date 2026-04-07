import type { AppRouteObject } from "../../routes";

import { OrgsRoute } from "./routes/Orgs";
import { OrgRoute } from "./routes/Org";

export type OrgRepresentation = {
  id: string;
  name: string;
  displayName: string;
  url: string;
  domains: string[];
  attributes: Record<string, string[]>;
};

const routes: AppRouteObject[] = [OrgsRoute, OrgRoute];

export default routes;
