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
import { useTranslation } from "react-i18next";
import { Controller, useForm } from "react-hook-form";

import type RoleRepresentation from "@keycloak/keycloak-admin-client/lib/defs/roleRepresentation";
import { useAlerts } from "@/shared/keycloak-ui-shared";

import useOrgFetcher from "../useOrgFetcher";
import { useRealm } from "../../../context/realm-context/RealmContext";

type EditOrgRoleProps = {
  orgId: string;
  handleModalToggle: () => void;
  refresh: (role?: RoleRepresentation) => void;
  role: RoleRepresentation;
};

export const EditOrgRoleModal = ({
  handleModalToggle,
  orgId,
  refresh,
  role,
}: EditOrgRoleProps) => {
  const { t } = useTranslation();
  const { realm } = useRealm();
  const { updateRoleForOrg } = useOrgFetcher(realm);
  const { addAlert, addError } = useAlerts();
  const {
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      name: role.name || "",
      description: role.description,
    },
  });

  const submitForm = async (role: { name: string; description?: string }) => {
    try {
      const resp = await updateRoleForOrg(orgId, role);
      if (resp.success) {
        refresh(role);
        handleModalToggle();
        addAlert("Role updated for this organization", AlertVariant.success);
        return;
      }
      throw new Error(resp.message);
    } catch (e: any) {
      addError(
        `Could not update the role for this organization. ${e.message}`,
        e,
      );
    }
  };

  return (
    <Modal
      variant={ModalVariant.medium}
      title={t("editRole")}
      isOpen={true}
      onClose={handleModalToggle}
      actions={[
        <Button
          data-testid={`updateRole`}
          key="confirm"
          variant="primary"
          type="submit"
          form="role-name-form"
          isDisabled={isSubmitting}
        >
          {t("save")}
        </Button>,
        <Button
          id="modal-cancel"
          data-testid="cancel"
          key="cancel"
          variant={ButtonVariant.link}
          onClick={() => {
            handleModalToggle();
          }}
        >
          {t("cancel")}
        </Button>,
      ]}
    >
      <Form
        id="role-name-form"
        isHorizontal
        onSubmit={handleSubmit(submitForm)}
      >
        <FormGroup
          name="update-role-name"
          label={t("roleName")}
          fieldId="role-name"
          isRequired
          disabled
        >
          <Controller
            name="name"
            control={control}
            rules={{ required: true, pattern: /\b[a-z]+/ }}
            render={({ field }) => (
              <TextInput
                id="update-role-name"
                value={field.value}
                onChange={field.onChange}
                data-testid="update-role-name-input"
                autoFocus
                validated={
                  errors.name
                    ? ValidatedOptions.error
                    : ValidatedOptions.default
                }
                isRequired
                isDisabled
              />
            )}
          />
          {errors.name && (
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
          name="role-description"
          label={t("description")}
          fieldId="role-description"
        >
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <TextInput
                id="role-description"
                value={field.value}
                onChange={field.onChange}
                data-testid="role-description-input"
                validated={
                  errors.description
                    ? ValidatedOptions.error
                    : ValidatedOptions.default
                }
              />
            )}
          />
          {errors.description && (
            <FormHelperText>
              <HelperText>
                <HelperTextItem variant={ValidatedOptions.error}>
                  {t("orgRoleErrorDescription")}
                </HelperTextItem>
              </HelperText>
            </FormHelperText>
          )}
        </FormGroup>
      </Form>
    </Modal>
  );
};
