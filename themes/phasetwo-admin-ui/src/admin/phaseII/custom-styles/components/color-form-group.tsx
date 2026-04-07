import type {
  PortalStylesTypeColors,
  PortalStylesType,
} from "../portal/portal-styles";
import { useTranslation } from "react-i18next";
import { Flex, FlexItem } from "@patternfly/react-core";
import { TextControl } from "@/shared/keycloak-ui-shared";
import type {
  FieldErrors,
  UseFormGetValues,
  UseFormRegister,
  UseFormSetValue,
} from "react-hook-form";
import { ColorPicker } from "./ColorPicker";

const HexColorPattern = /^#([0-9a-f]{3}){1,2}$/;

type ColorFormGroupProps = {
  colorKey: keyof PortalStylesTypeColors;
  errors: FieldErrors<PortalStylesType>;
  getValues: UseFormGetValues<PortalStylesType>;
  setValue: UseFormSetValue<PortalStylesType>;
  register: UseFormRegister<PortalStylesType>;
};

const ColorFormGroup: React.FC<ColorFormGroupProps> = ({
  colorKey,
  getValues,
  setValue,
}) => {
  const { t } = useTranslation();
  return (
    <Flex alignItems={{ default: "alignItemsCenter" }}>
      <FlexItem>
        <ColorPicker
          color={getValues(colorKey)}
          onChange={(color) => setValue(colorKey, color)}
        />
      </FlexItem>
      <FlexItem grow={{ default: "grow" }}>
        <TextControl
          type="text"
          id={`kc-styles-${colorKey}-url`}
          name={colorKey}
          label={t(colorKey)}
          labelIcon={t("colorHelp")}
          data-testid={`kc-styles-${colorKey}-url`}
          rules={{
            required: true,
            pattern: {
              value: HexColorPattern,
              message: t("colorHelp"),
            },
          }}
        />
      </FlexItem>
    </Flex>
  );
};

export default ColorFormGroup;
