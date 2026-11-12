import {
  AlertVariant,
  Button,
  ButtonVariant,
  Form,
  FormGroup,
  FormHelperText,
  HelperText,
  HelperTextItem,
  Modal,
  ModalVariant,
  TextInput,
  ValidatedOptions,
} from "@patternfly/react-core";
import { useState } from "react";
import { Controller, FormProvider, useForm } from "react-hook-form";

import {
  SelectControl,
  SelectVariant,
  useAlerts,
  useFetch,
} from "@/shared/keycloak-ui-shared";

import useOrgFetcher, { OrgApiError } from "../useOrgFetcher";
import { useRealm } from "../../../context/realm-context/RealmContext";
import { useAccess } from "../../../context/access/Access";
import { useWhoAmI } from "../../../context/whoami/WhoAmI";
import { getInvitableRoles, type InvitableRole } from "../invitation-roles";
import type { OrgRepresentation } from "../routes";
import { HelpItem } from "@/shared/keycloak-ui-shared";
import { useTranslation } from "react-i18next";

type AddInvitationProps = {
  toggleVisibility: () => void;
  org: OrgRepresentation;
  refresh: () => void;
};

type InvitationFormValues = {
  email: string;
  redirectUri?: string;
  roles: string[];
};

export default function AddInvitation({
  toggleVisibility,
  org,
  refresh,
}: AddInvitationProps) {
  const { t } = useTranslation();
  const form = useForm<InvitationFormValues>({
    defaultValues: { roles: [] },
  });
  const {
    formState: { errors },
    handleSubmit,
    control,
  } = form;
  const { realm } = useRealm();
  const { hasAccess } = useAccess();
  const { whoAmI } = useWhoAmI();
  const { createInvitation, getRolesForOrg, listOrgRolesForUser } =
    useOrgFetcher(realm);
  const { addAlert, addError } = useAlerts();
  const [invitableRoles, setInvitableRoles] = useState<InvitableRole[]>([]);

  const canManageOrganizations = hasAccess("manage-organizations");
  // whoAmI.userId belongs to the realm the admin signed in to, which is only
  // a user of this realm (and so possibly an org member) if the two match.
  const currentUserId =
    whoAmI.realm === realm && whoAmI.userId ? whoAmI.userId : undefined;

  useFetch(
    () =>
      getInvitableRoles({
        canManageOrganizations,
        currentUserId,
        listOrgRoles: () => getRolesForOrg(org.id),
        listUserOrgRoles: async (userId) => {
          const result = await listOrgRolesForUser(org.id, { id: userId });
          return result.data ?? [];
        },
      }).catch(() => [] as InvitableRole[]),
    setInvitableRoles,
    [org.id, canManageOrganizations, currentUserId],
  );

  const submitForm = async (invitation: InvitationFormValues) => {
    const roles = invitation.roles ?? [];
    try {
      await createInvitation(
        org.id,
        invitation.email,
        true,
        invitation.redirectUri ?? "",
        roles,
      );
      addAlert(t("inviteSent"));
      refresh();
      toggleVisibility();
    } catch (error) {
      if (
        error instanceof OrgApiError &&
        error.status === 401 &&
        roles.length > 0
      ) {
        addAlert(t("inviteRolesNotPermitted"), AlertVariant.danger);
        return;
      }
      addError("inviteSentError", error);
    }
  };

  return (
    <Modal
      variant={ModalVariant.small}
      title="Invite a User"
      isOpen={true}
      onClose={toggleVisibility}
      actions={[
        <Button
          data-testid="createinvitation"
          key="confirm"
          variant="primary"
          type="submit"
          form="invitation-form"
        >
          Create
        </Button>,
        <Button
          id="modal-cancel"
          key="cancel"
          variant={ButtonVariant.link}
          onClick={() => {
            toggleVisibility();
          }}
        >
          Cancel
        </Button>,
      ]}
    >
      <FormProvider {...form}>
        <Form
          id="invitation-form"
          isHorizontal
          onSubmit={handleSubmit(submitForm)}
        >
          <FormGroup
            name="create-modal-org-invitation"
            label="Email"
            fieldId="email"
            isRequired
          >
            <Controller
              name="email"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <TextInput
                  autoFocus
                  id="email"
                  value={field.value}
                  onChange={field.onChange}
                  data-testid="email-input"
                />
              )}
            />
            {errors.email && (
              <FormHelperText>
                <HelperText>
                  <HelperTextItem variant={ValidatedOptions.error}>
                    {t("required")}
                  </HelperTextItem>
                </HelperText>
              </FormHelperText>
            )}
          </FormGroup>
          <FormGroup
            name="create-modal-org-invitation"
            label="Redirect URI"
            fieldId="redirectUri"
            labelIcon={
              <HelpItem
                helpText={t("redirectUriHelp")}
                fieldLabelId={t("redirectUri")}
              />
            }
          >
            <Controller
              name="redirectUri"
              control={control}
              rules={{ required: false }}
              render={({ field }) => (
                <TextInput
                  id="redirectUri"
                  value={field.value}
                  onChange={field.onChange}
                  data-testid="redirectUri-input"
                />
              )}
            />
            {errors.redirectUri && (
              <FormHelperText>
                <HelperText>
                  <HelperTextItem variant={ValidatedOptions.error}>
                    {t("addRedirectUri")}
                  </HelperTextItem>
                </HelperText>
              </FormHelperText>
            )}
          </FormGroup>
          {invitableRoles.length > 0 && (
            <SelectControl
              name="roles"
              label={t("inviteRoles")}
              labelIcon={t("inviteRolesHelp")}
              controller={{ defaultValue: [] }}
              variant={SelectVariant.typeaheadMulti}
              isScrollable
              maxMenuHeight="300px"
              chipGroupProps={{ numChips: 3 }}
              placeholderText={t("inviteRolesPlaceholder")}
              menuAppendTo="parent"
              data-testid="invitation-roles"
              options={invitableRoles.map(({ name }) => ({
                key: name,
                value: name,
              }))}
            />
          )}
        </Form>
      </FormProvider>
    </Modal>
  );
}
