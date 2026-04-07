import {
  Button,
  ButtonVariant,
  Checkbox,
  FormGroup,
  FormHelperText,
  Modal,
  ModalVariant,
} from "@patternfly/react-core";
import { useAdminClient } from "../../../admin-client";
import { useRealm } from "../../../context/realm-context/RealmContext";
import IdentityProviderRepresentation from "@keycloak/keycloak-admin-client/lib/defs/identityProviderRepresentation";
import { useTranslation } from "react-i18next";
import { Form, FormProvider, useForm, Controller } from "react-hook-form";
import { useEffect } from "react";
import { OrgRepresentation } from "../routes";

type EditIdentityProviderHomeIdpDomainsProps = {
  org: OrgRepresentation;
  idp?: IdentityProviderRepresentation;
  onClear: () => void;
};

type EditIdentityProviderHomeIdpDomainsForm = {
  homeIdpDomains: string[];
};

export default function EditIdentityProviderHomeIdpDomains({
  idp,
  onClear,
  org,
}: EditIdentityProviderHomeIdpDomainsProps) {
  const { adminClient } = useAdminClient();
  const { t } = useTranslation();
  const { realm } = useRealm();

  const initialDomains =
    idp?.config?.["home.idp.discovery.domains"]?.split("##") || [];

  const form = useForm<EditIdentityProviderHomeIdpDomainsForm>({
    defaultValues: {
      homeIdpDomains: initialDomains,
    },
  });

  const { control, handleSubmit, reset } = form;

  // Reset form when idp changes
  useEffect(() => {
    if (idp) {
      const domains =
        idp.config?.["home.idp.discovery.domains"]?.split("##") || [];
      reset({
        homeIdpDomains: domains,
      });
    }
  }, [idp, reset]);

  async function handleConfirm() {
    await handleSubmit(async (data) => {
      if (!idp) return;

      try {
        const updatedIdp = {
          ...idp,
          config: {
            ...idp.config,
            "home.idp.discovery.domains": data.homeIdpDomains.join("##"),
          },
        };

        await adminClient.identityProviders.update(
          { realm, alias: idp.alias! },
          updatedIdp,
        );

        onClear();
      } catch (error) {
        console.error("Failed to update identity provider:", error);
      }
    })();
  }

  return (
    <Modal
      variant={ModalVariant.medium}
      isOpen={!!idp}
      title={t("idpEditTitle", { idpAlias: idp?.alias })}
      onClose={() => onClear()}
      actions={[
        <Button
          id="modal-confirm"
          data-testid="modal-confirm"
          key="confirm"
          isDisabled={!idp}
          onClick={() => handleConfirm()}
        >
          {t("confirm")}
        </Button>,
        <Button
          data-testid="cancel"
          id="modal-cancel"
          key="cancel"
          variant={ButtonVariant.link}
          onClick={() => onClear()}
        >
          {t("cancel")}
        </Button>,
      ]}
    >
      <FormProvider {...form}>
        <Form id="edit-idp-form">
          <FormGroup
            label={t("homeIdpDomains")}
            fieldId="homeIdpDomains"
            role="group"
            className="pf-v5-u-mt-lg"
          >
            <Controller
              name="homeIdpDomains"
              control={control}
              render={({ field }) => {
                const validDomains =
                  org.domains?.filter((domain) => domain.trim() !== "") || [];

                return (
                  <div>
                    {validDomains.length > 0 ? (
                      validDomains.map((domain) => (
                        <Checkbox
                          key={domain}
                          id={`domain-${domain}`}
                          label={domain}
                          isChecked={field.value.includes(domain)}
                          className="pf-v5-u-mt-sm"
                          onChange={(event, checked) => {
                            const currentValues = field.value || [];
                            if (checked) {
                              // Add domain if not already selected
                              if (!currentValues.includes(domain)) {
                                field.onChange([...currentValues, domain]);
                              }
                            } else {
                              // Remove domain if currently selected
                              field.onChange(
                                currentValues.filter((d) => d !== domain),
                              );
                            }
                          }}
                        />
                      ))
                    ) : (
                      <div>{t("orgNoDomainsAvailable")}</div>
                    )}
                  </div>
                );
              }}
            />
            <FormHelperText className="pf-v5-u-mt-lg">
              {t("orgIdpAssignedDomainsHelperText")}
            </FormHelperText>
          </FormGroup>
        </Form>
      </FormProvider>
    </Modal>
  );
}
