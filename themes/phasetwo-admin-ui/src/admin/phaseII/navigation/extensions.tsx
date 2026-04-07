import { NavGroup } from "@patternfly/react-core";
import { useTranslation } from "react-i18next";
import { LeftNav } from "../../PageNav";
import { useAccess } from "../../context/access/Access";

const Extensions = () => {
  const { t } = useTranslation();
  const { hasSomeAccess } = useAccess();

  const showOrgs = hasSomeAccess("view-organizations", "manage-organizations");

  return (
    <NavGroup aria-label={t("extensions")} title={t("extensions")}>
      {showOrgs && <LeftNav title={t("orgList")} path="/ext-organizations" />}
      <LeftNav title={t("styles")} path="/ext-styles" />
    </NavGroup>
  );
};

export default Extensions;
