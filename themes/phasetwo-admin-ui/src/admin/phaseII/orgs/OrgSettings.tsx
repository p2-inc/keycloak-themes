import { useEffect } from "react";
import {
  Form,
  Button,
  ActionGroup,
  Grid,
  GridItem,
  AlertVariant,
} from "@patternfly/react-core";
import { FormProvider, useForm } from "react-hook-form";
import { defaultOrgState, OrgFormType } from "./modals/NewOrgModal";
import type { OrgRepresentation } from "./routes";
import { OrgFields } from "./form/OrgFields";
import useOrgFetcher from "./useOrgFetcher";
import { useRealm } from "../../context/realm-context/RealmContext";
import { useTranslation } from "react-i18next";
import { useAlerts } from "@/shared/keycloak-ui-shared";
type OrgSettingsProps = {
  org: OrgRepresentation;
  refresh: () => void;
};

export default function OrgSettings({ org, refresh }: OrgSettingsProps) {
  const { realm } = useRealm();
  const { t } = useTranslation();
  const { addAlert } = useAlerts();
  const organizationForm = useForm<OrgFormType>({
    defaultValues: defaultOrgState,
    mode: "onChange",
    shouldUnregister: false,
  });
  const {
    handleSubmit,
    reset,
    getValues,
    formState: { isDirty },
  } = organizationForm;
  const { updateOrg } = useOrgFetcher(realm);

  useEffect(() => {
    organizationForm.setValue("name", org.name);
    organizationForm.setValue("displayName", org.displayName);
    organizationForm.setValue("url", org.url);
    organizationForm.setValue("domains", org.domains);
  }, [org]);

  const save = async () => {
    if (org) {
      const orgData: OrgFormType = getValues();
      const updatedData: OrgRepresentation = {
        ...org,
        ...orgData,
        // domains: orgData.domains.map((d) => d.value).filter((d) => d),
      };

      const res = await updateOrg(updatedData);
      if (res.success) {
        addAlert("Organization saved.");
      } else {
        addAlert(res.message, AlertVariant.danger);
      }
      refresh();
    }
  };

  function resetForm() {
    if (org) {
      reset({
        ...org,
      });
    }
  }

  return (
    <Grid hasGutter className="pf-v5-u-px-lg pf-v5-u-mt-xl">
      <GridItem span={8}>
        <FormProvider {...organizationForm}>
          <Form
            isHorizontal
            onSubmit={handleSubmit(() => console.log("Submitted"))}
          >
            <OrgFields />
            <ActionGroup className="">
              <Button onClick={save} disabled={!isDirty}>
                {t("save")}
              </Button>
              <Button variant="link" onClick={resetForm}>
                {t("revert")}
              </Button>
            </ActionGroup>
          </Form>
        </FormProvider>
      </GridItem>
    </Grid>
  );
}
