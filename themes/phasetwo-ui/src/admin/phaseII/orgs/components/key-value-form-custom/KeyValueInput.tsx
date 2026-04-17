import {
  ActionList,
  ActionListItem,
  Button,
  Flex,
  FlexItem,
} from "@patternfly/react-core";
import { MinusCircleIcon, PlusCircleIcon } from "@patternfly/react-icons";
import { useEffect } from "react";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { KeyValueType } from "./key-value-convert";
import { TextControl } from "@/shared/keycloak-ui-shared";

type KeyValueInputProps = {
  name: string;
  allowFullClear?: boolean;
};

export const KeyValueInput = ({ name, allowFullClear }: KeyValueInputProps) => {
  const { t } = useTranslation();
  const { control } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name,
  });

  const watchFields = useWatch({
    control,
    name,
    defaultValue: [{ key: "", value: "" }],
  });

  const isValid =
    Array.isArray(watchFields) &&
    watchFields.every(
      ({ key, value }: KeyValueType) =>
        key?.trim().length !== 0 && value?.trim().length !== 0,
    );

  useEffect(() => {
    if (!fields.length) {
      append({ key: "", value: "" }, { shouldFocus: false });
    }
  }, [fields]);

  return (
    <>
      <Flex direction={{ default: "column" }}>
        <Flex>
          <FlexItem
            grow={{ default: "grow" }}
            spacer={{ default: "spacerNone" }}
          >
            <strong>{t("key")}</strong>
          </FlexItem>
          <FlexItem grow={{ default: "grow" }}>
            <strong>{t("value")}</strong>
          </FlexItem>
        </Flex>
        {fields.map((attribute, index) => (
          <Flex key={attribute.id} data-testid="row">
            <FlexItem grow={{ default: "grow" }}>
              <TextControl
                placeholder={t("keyPlaceholder")}
                aria-label={t("key")}
                data-testid={`${name}[${index}].key`}
                name={`${name}[${index}].key`}
                label=" "
              />
            </FlexItem>
            <FlexItem
              grow={{ default: "grow" }}
              spacer={{ default: "spacerNone" }}
            >
              <TextControl
                placeholder={t("valuePlaceholder")}
                aria-label={t("value")}
                data-testid={`${name}[${index}].value`}
                name={`${name}[${index}].value`}
                label=" "
              />
            </FlexItem>
            <FlexItem>
              <Button
                variant="link"
                title={t("removeAttribute")}
                isDisabled={allowFullClear ? false : watchFields.length === 1}
                onClick={() => remove(index)}
                data-testid={`${name}[${index}].remove`}
              >
                <MinusCircleIcon />
              </Button>
            </FlexItem>
          </Flex>
        ))}
      </Flex>
      <ActionList>
        <ActionListItem>
          <Button
            data-testid={`${name}-add-row`}
            className="pf-v5-u-px-0 pf-v5-u-mt-sm"
            variant="link"
            icon={<PlusCircleIcon />}
            isDisabled={!isValid}
            onClick={() => append({ key: "", value: "" })}
          >
            {t("addAttribute", { label: t("attribute") })}
          </Button>
        </ActionListItem>
      </ActionList>
    </>
  );
};
