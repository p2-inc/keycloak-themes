/**
 * This file has been claimed for ownership from @keycloakify/keycloak-admin-ui version 260502.0.0.
 * To relinquish ownership and restore this file to its original content, run the following command:
 *
 * $ npx keycloakify own --path "admin/PageHeader.tsx" --revert
 */

/* eslint-disable */

// @ts-nocheck

import logoSvgUrl from "./assets/logo.svg";
import {
  KeycloakMasthead,
  useEnvironment,
  useHelp,
} from "../shared/keycloak-ui-shared";
import { DropdownItem, ToolbarItem } from "../shared/@patternfly/react-core";
import { HelpIcon } from "../shared/@patternfly/react-icons";
import { useTranslation } from "react-i18next";
import { Link, useHref } from "react-router-dom";
import { PageHeaderClearCachesModal } from "./PageHeaderClearCachesModal";
import { HelpHeader } from "./components/help-enabler/HelpHeader";
import { useAccess } from "./context/access/Access";
import { useRealm } from "./context/realm-context/RealmContext";
import { toDashboard } from "./dashboard/routes/Dashboard";
import { usePreviewLogo } from "./realm-settings/themes/LogoContext";
import { joinPath } from "./utils/joinPath";
import useToggle from "./utils/useToggle";
import { MastheadStats } from "./phaseII/dashboard/MastheadStats";

const ManageAccountDropdownItem = () => {
  const { keycloak } = useEnvironment();

  const { t } = useTranslation();
  return (
    <DropdownItem
      key="manage account"
      id="manage-account"
      onClick={() => keycloak.accountManagement()}
    >
      {t("manageAccount")}
    </DropdownItem>
  );
};

const ServerInfoDropdownItem = () => {
  const { realm } = useRealm();
  const { t } = useTranslation();

  return (
    <DropdownItem
      key="server info"
      component={(props) => <Link {...props} to={toDashboard({ realm })} />}
    >
      {t("realmInfo")}
    </DropdownItem>
  );
};

const ClearCachesDropdownItem = () => {
  const { t } = useTranslation();
  const [open, toggleModal] = useToggle();

  return (
    <>
      <DropdownItem key="clear caches" onClick={() => toggleModal()}>
        {t("clearCachesTitle")}
      </DropdownItem>
      {open && <PageHeaderClearCachesModal onClose={() => toggleModal()} />}
    </>
  );
};

const HelpDropdownItem = () => {
  const { t } = useTranslation();
  const { enabled, toggleHelp } = useHelp();
  return (
    <DropdownItem
      data-testId="helpIcon"
      icon={<HelpIcon />}
      onClick={toggleHelp}
    >
      {enabled ? t("helpEnabled") : t("helpDisabled")}
    </DropdownItem>
  );
};

const kebabDropdownItems = (isMasterRealm: boolean, isManager: boolean) => [
  <ManageAccountDropdownItem key="kebab Manage Account" />,
  <ServerInfoDropdownItem key="kebab Server Info" />,
  ...(isMasterRealm && isManager
    ? [<ClearCachesDropdownItem key="Clear Caches" />]
    : []),
  <HelpDropdownItem key="kebab Help" />,
];

const userDropdownItems = (isMasterRealm: boolean, isManager: boolean) => [
  <ManageAccountDropdownItem key="Manage Account" />,
  <ServerInfoDropdownItem key="Server info" />,
  ...(isMasterRealm && isManager
    ? [<ClearCachesDropdownItem key="Clear Caches" />]
    : []),
];

export const Header = () => {
  const { environment, keycloak } = useEnvironment();
  const { t } = useTranslation();
  const { realm } = useRealm();
  const { hasAccess } = useAccess();

  const contextLogo = usePreviewLogo();
  const customLogo = contextLogo?.logo;

  const isMasterRealm = realm === "master";
  const isManager = hasAccess("manage-realm");

  const url = useHref(toDashboard({ realm }));
  const logoUrl = environment.logoUrl ? environment.logoUrl : url;

  return (
    <KeycloakMasthead
      data-testid="page-header"
      keycloak={keycloak}
      features={{ hasManageAccount: false }}
      brand={{
        href: logoUrl,
        src: customLogo
          ? customLogo.startsWith("/")
            ? joinPath(environment["resourceUrl"], customLogo)
            : customLogo
          : logoSvgUrl,
        alt: t("logo"),
        className: "keycloak__pageheader_brand",
      }}
      dropdownItems={userDropdownItems(isMasterRealm, isManager)}
      kebabDropdownItems={kebabDropdownItems(isMasterRealm, isManager)}
      toolbarItems={[
        <ToolbarItem
          key="help"
          visibility={{ default: "hidden", md: "visible" }}
        >
          <MastheadStats />
          <HelpHeader />
        </ToolbarItem>,
      ]}
    />
  );
};
