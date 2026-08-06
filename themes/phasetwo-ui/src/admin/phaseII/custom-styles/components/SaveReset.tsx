import { useTranslation } from "react-i18next";
import {
  ActionGroup,
  ActionGroupProps,
  Button,
  Tooltip,
} from "@patternfly/react-core";
import { useAccess } from "../../../context/access/Access";

type SaveResetProps = ActionGroupProps & {
  name: string;
  save: () => void;
  reset: () => void;
  isActive?: boolean;
};

export const SaveReset = ({
  name,
  save,
  reset,
  isActive = true,
  ...rest
}: SaveResetProps) => {
  const { t } = useTranslation();
  const { hasAccess } = useAccess();
  // Saving custom styles writes realm attributes (PUT /admin/realms/{realm}),
  // which the server authorizes with manage-realm. The route only requires
  // view-realm, so a view-only admin can reach this page — disable Save for
  // them rather than let the request 403 on click.
  const canManageRealm = hasAccess("manage-realm");

  const revertButton = (
    <Button
      isDisabled={!isActive}
      data-testid={name + "Revert"}
      variant="link"
      onClick={reset}
    >
      {t("revert")}
    </Button>
  );

  if (!canManageRealm) {
    return (
      <ActionGroup {...rest}>
        <Tooltip content="You need the manage-realm role to save changes.">
          <Button isAriaDisabled data-testid={name + "Save"}>
            {t("save")}
          </Button>
        </Tooltip>
        {revertButton}
      </ActionGroup>
    );
  }

  return (
    <ActionGroup {...rest}>
      <Button isDisabled={!isActive} data-testid={name + "Save"} onClick={save}>
        {t("save")}
      </Button>
      {revertButton}
    </ActionGroup>
  );
};
