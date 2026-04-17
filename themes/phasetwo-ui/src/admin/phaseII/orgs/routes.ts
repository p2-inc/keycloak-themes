import type { AppRouteObject } from "../../routes";

import { OrgsRoute } from "./routes/Orgs";
import { OrgRoute } from "./routes/Org";
import { OrgMemberRoute } from "./routes/OrgMember";

export type OrgRepresentation = {
  id: string;
  name: string;
  displayName: string;
  url: string;
  domains: string[];
  attributes: Record<string, string[]>;
};

const routes: AppRouteObject[] = [OrgsRoute, OrgMemberRoute, OrgRoute];

export default routes;
