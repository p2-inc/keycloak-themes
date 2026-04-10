import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import {
  Alert,
  AlertVariant,
  PageSection,
  PageSectionVariants,
} from "@patternfly/react-core";

import { useAlerts } from "@/shared/keycloak-ui-shared";
import { FormattedLink } from "../../components/external-link/FormattedLink";
import helpUrls from "../../help-urls";

import {
  AttributeForm,
  AttributesForm,
} from "../orgs/components/key-value-form-custom/AttributeForm";
import RealmRepresentation from "@keycloak/keycloak-admin-client/lib/defs/realmRepresentation";
import { useAdminClient } from "../../admin-client";

type RealmSettingsAttributeTabProps = {
  realm: RealmRepresentation;
};

export const RealmSettingsAttributeTab = ({
  realm: defaultRealm,
}: RealmSettingsAttributeTabProps) => {
  const { t } = useTranslation("realm-settings");
  const { addAlert, addError } = useAlerts();
  const [realm, setRealm] = useState<RealmRepresentation>(defaultRealm);
  const form = useForm<AttributeForm>({ mode: "onChange" });
  const { adminClient } = useAdminClient();

  const convertAttributes = () => {
    const attributes: { key: string; value: string }[] = Object.entries(
      realm.attributes || {},
    ).flatMap(([key, value]) => ({ key, value }));

    return attributes
      .filter((a) => a.key.startsWith("_providerConfig"))
      .sort((a, b) => {
        const keyA = a.key.toLowerCase();
        const keyB = b.key.toLowerCase();
        if (keyA < keyB) return -1;
        if (keyA > keyB) return 1;
        return 0;
      });
  };

  useEffect(() => {
    form.setValue("attributes", convertAttributes());
  }, [realm]);

  const save = async (attributeForm: AttributeForm) => {
    const attributes: Record<string, string> = {};
    attributeForm.attributes!.map(
      ({ key, value }) => (attributes[key] = value),
    );

    try {
      await adminClient.realms.update(
        { realm: realm.realm! },
        { ...realm, attributes },
      );

      setRealm({ ...realm, attributes });
      addAlert(t("saveRealmSettingsSuccess"), AlertVariant.success);
    } catch (error) {
      addError("groups:groupUpdateError", error);
    }
  };

  return (
    <PageSection variant={PageSectionVariants.light}>
      <Alert
        variant="danger"
        title="Expert mode customization for Phase Two extensions."
        className="pf-v5-u-mb-lg pf-v5-u-w-75-on-md"
      >
        <p>
          This may override configuration changes elsewhere and cause unexpected
          behavior. Use this only if you are sure what you are doing.{" "}
          <FormattedLink
            title={t("learn more")}
            href={helpUrls.realmAttributesUrl}
            isInline
          />
        </p>
      </Alert>
      <div className="pf-v5-u-mb-lg pf-v5-u-w-75-on-md">
        <AttributesForm
          form={form}
          save={save}
          reset={() =>
            form.reset({
              attributes: convertAttributes(),
            })
          }
          allowFullClear
        />
      </div>
    </PageSection>
  );
};
