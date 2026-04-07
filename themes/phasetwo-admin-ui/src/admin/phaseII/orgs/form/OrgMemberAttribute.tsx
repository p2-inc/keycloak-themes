import { useTranslation } from "react-i18next";
import { Controller } from "react-hook-form";
import { FormGroup, Grid, GridItem, TextInput } from "@patternfly/react-core";
import { MultiLineInput } from "../../../components/multi-line-input/MultiLineInput";
import { HelpItem } from "@/shared/keycloak-ui-shared";
import { useEffect } from "react";
import {
  Form,
  Button,
  ActionGroup,
  AlertVariant,
} from "@patternfly/react-core";
import { FormProvider, useForm, SubmitHandler } from "react-hook-form";
import { defaultOrgState, OrgFormType } from "../modals/NewOrgModal";
import type { OrgRepresentation } from "../routes";
import { OrgFields } from "../form/OrgFields";
import useOrgFetcher, {
  PhaseTwoOrganizationMemberAttributesRepresentation,
  PhaseTwoOrganizationUserRepresentation,
} from "../useOrgFetcher";
import { useRealm } from "../../../context/realm-context/RealmContext";
import { useAlerts } from "@/shared/keycloak-ui-shared";

type Inputs = {
  name: string;
  value: string;
};

type Props = {
  userId: string;
  userAttributes?: PhaseTwoOrganizationMemberAttributesRepresentation;
  orgId: string;
  updateUser?: () => void;
};

export const OrgMemberAttribute = ({
  userId,
  userAttributes,
  orgId,
  updateUser,
}: Props) => {
  const { t } = useTranslation();

  const { realm } = useRealm();
  const { addAlert } = useAlerts();

  const { updateAttributesForOrgMember } = useOrgFetcher(realm);

  const addMemberAttributeForm = useForm<Inputs>();
  const {
    handleSubmit: handleMemberAttributeSubmit,
    reset: resetMemberAttributeForm,
    formState: { isDirty: isMemberAttributeDirty },
    control,
  } = addMemberAttributeForm;

  const onSubmit: SubmitHandler<Inputs> = async (data) => {
    if (!data.name || !data.value) {
      console.error("Name and value are required");
      return;
    }

    try {
      await updateAttributesForOrgMember(orgId, userId, {
        ...userAttributes,
        [data.name]: [data.value],
      });
      resetMemberAttributeForm({ name: "", value: "" });
      addAlert("Added attribute to member", AlertVariant.success);
    } catch (error) {
      console.error("Error updating member attribute", error);
      addAlert("Failed to add attribute to member", AlertVariant.danger);
    } finally {
      if (updateUser) {
        updateUser();
      }
    }
  };

  return (
    <FormProvider {...addMemberAttributeForm}>
      <Form onSubmit={handleMemberAttributeSubmit(onSubmit)}>
        <h2 className="pf-v5-c-title pf-v5-u-mt-xl">Add attribute</h2>
        <Grid hasGutter>
          <GridItem span={4}>
            <FormGroup label="Name" fieldId="name">
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <TextInput
                    id="name"
                    value={field.value}
                    onChange={field.onChange}
                    data-testid="name-input"
                  />
                )}
              />
            </FormGroup>
          </GridItem>
          <GridItem span={8}>
            <FormGroup label="Value" fieldId="value">
              <Controller
                name="value"
                control={control}
                render={({ field }) => (
                  <TextInput
                    id="value"
                    value={field.value}
                    onChange={field.onChange}
                    data-testid="value-input"
                  />
                )}
              />
            </FormGroup>
          </GridItem>
        </Grid>
        <ActionGroup className="pf-v5-u-mt-xs">
          <Button type="submit" disabled={!isMemberAttributeDirty}>
            {t("addAttributeToOrgMember")}
          </Button>
          <Button
            variant="link"
            onClick={() => resetMemberAttributeForm({ name: "", value: "" })}
          >
            {t("reset")}
          </Button>
        </ActionGroup>
      </Form>
    </FormProvider>
  );
};
