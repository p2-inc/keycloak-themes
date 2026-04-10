import {
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
import { Controller, useForm } from "react-hook-form";

import { useAlerts } from "@/shared/keycloak-ui-shared";

import useOrgFetcher from "./useOrgFetcher";
import { useRealm } from "../../context/realm-context/RealmContext";
import type { OrgRepresentation } from "./routes";
import { HelpItem } from "@/shared/keycloak-ui-shared";
import { useTranslation } from "react-i18next";

type AddInvitationProps = {
  toggleVisibility: () => void;
  org: OrgRepresentation;
  refresh: () => void;
};
export default function AddInvitation({
  toggleVisibility,
  org,
  refresh,
}: AddInvitationProps) {
  const { t } = useTranslation();
  const {
    formState: { errors },
    handleSubmit,
    control,
  } = useForm();
  const { realm } = useRealm();
  const { createInvitation } = useOrgFetcher(realm);
  const { addAlert } = useAlerts();

  const submitForm = async (invitation: any) => {
    await createInvitation(
      org.id,
      invitation.email,
      true,
      invitation.redirectUri,
    );
    addAlert(`${invitation.email} has been invited`);
    refresh();
    toggleVisibility();
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
      </Form>
    </Modal>
  );
}
