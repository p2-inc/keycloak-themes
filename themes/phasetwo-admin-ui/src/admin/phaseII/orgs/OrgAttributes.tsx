import { useEffect } from "react";
import {
  AttributeForm,
  AttributesForm,
} from "./components/key-value-form-custom/AttributeForm";
import { OrgRepresentation } from "./routes";
import { useForm } from "react-hook-form";
import {
  arrayToKeyValue,
  keyValueToArray,
} from "../../components/key-value-form/key-value-convert";
import type { KeyValueType } from "../../components/key-value-form/key-value-convert";
import useOrgFetcher from "./useOrgFetcher";
import { useRealm } from "../../context/realm-context/RealmContext";
import { useAlerts } from "@/shared/keycloak-ui-shared";
import { CardBody, Card } from "@patternfly/react-core";
import { FormattedLink } from "../../components/external-link/FormattedLink";
import helpUrls from "../../help-urls";
import { useTranslation } from "react-i18next";

type OrgAttributesProps = {
  org: OrgRepresentation;
  refresh: () => void;
};

type AttributesForm = {
  attributes?: KeyValueType[];
};

export default function OrgAttributes({ org, refresh }: OrgAttributesProps) {
  const { t } = useTranslation();
  const { addAlert } = useAlerts();
  const { realm } = useRealm();
  const { updateOrg } = useOrgFetcher(realm);

  useEffect(() => {
    if (org.attributes) {
      const attributes = convertAttributes();
      attributesForm.setValue("attributes", attributes);
    }
  }, [org]);

  const attributesForm = useForm<AttributeForm>({
    mode: "onChange",
    shouldUnregister: false,
  });

  const convertAttributes = (attr?: Record<string, any>) => {
    return arrayToKeyValue(attr || org.attributes);
  };

  async function saveAttributes(data: any) {
    if (org) {
      const attributes = keyValueToArray(data.attributes);
      const updatedData: OrgRepresentation = { ...org, attributes };
      await updateOrg(updatedData);
      addAlert("Attributes updated for organization");
      refresh();
    }
  }

  function resetAttributes() {
    console.log("Implement attributes reset");
  }

  return (
    <div className="pf-v5-u-pt-lg">
      <div className="pf-v5-u-mb-md pf-v5-u-px-lg">
        <FormattedLink
          title={t("learnMore")}
          href={helpUrls.orgAttributesUrl}
          isInline
        />
      </div>
      <Card isFlat>
        <CardBody>
          <AttributesForm
            form={attributesForm}
            save={saveAttributes}
            reset={resetAttributes}
            allowFullClear
          />
        </CardBody>
      </Card>
    </div>
  );
}
