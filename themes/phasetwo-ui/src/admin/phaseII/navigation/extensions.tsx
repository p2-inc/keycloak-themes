import { NavGroup } from "@patternfly/react-core";
import { useTranslation } from "react-i18next";
import { LeftNav } from "../../PageNav";
import { useAccess } from "../../context/access/Access";
import { ORGANIZATION_ROLES } from "../access/access";

const Extensions = () => {
  const { t } = useTranslation();
  const { hasSomeAccess } = useAccess();

  const showOrgs = hasSomeAccess(...ORGANIZATION_ROLES);

  return (
    <NavGroup aria-label={t("extensions")} title={t("extensions")}>
      {showOrgs && <LeftNav title="orgList" path="/ext-organizations" />}
      <LeftNav title="styles" path="/ext-styles" />
    </NavGroup>
  );
};

export default Extensions;
