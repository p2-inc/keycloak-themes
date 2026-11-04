import type { UserProfileConfig } from "@keycloak/keycloak-admin-client/lib/defs/userProfileMetadata";
import {
  Button,
  Chip,
  ChipGroup,
  Divider,
  Dropdown,
  DropdownGroup,
  DropdownItem,
  DropdownList,
  HelperText,
  HelperTextItem,
  InputGroup,
  InputGroupItem,
  MenuToggle,
  TextInput,
} from "@patternfly/react-core";
import { FilterIcon } from "@patternfly/react-icons";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { label } from "@/shared/keycloak-ui-shared";
import {
  addLookupFilter,
  detectLookupField,
  type UserLookupFilter,
} from "./user-lookup";

const AUTO = "__auto";
const CUSTOM = "__custom";

/** Built-in user fields; first and last name are left out because matching them can't use an index. */
const SKIPPED_PROFILE_ATTRIBUTES = ["username", "email", "firstName", "lastName"];

type UserLookupProps = {
  filters: UserLookupFilter[];
  onChange: (filters: UserLookupFilter[]) => void;
  /** User profile, for the attribute list. Omit to offer only username, email and ID. */
  profile?: UserProfileConfig;
  /** Several filters combined with AND (Users page) or a single lookup (pickers). */
  multi?: boolean;
  /** Offer user profile and custom attributes. */
  showAttributes?: boolean;
};

export const UserLookup = ({
  filters,
  onChange,
  profile,
  multi = true,
  showAttributes = true,
}: UserLookupProps) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [field, setField] = useState(AUTO);
  const [customKey, setCustomKey] = useState("");
  const [value, setValue] = useState("");

  const attributes = (profile?.attributes ?? []).filter(
    (a) => a.name && !SKIPPED_PROFILE_ATTRIBUTES.includes(a.name),
  );
  const attributeLabel = (name: string) => {
    const attribute = attributes.find((a) => a.name === name);
    return attribute ? label(t, attribute.displayName, attribute.name) : name;
  };

  const resolvedField = () => {
    if (field === AUTO) return detectLookupField(value);
    if (field === CUSTOM) return customKey.trim();
    return field;
  };

  const toggleText = () => {
    if (field === AUTO) return t("userLookupAuto");
    if (field === CUSTOM) return t("userLookupCustomAttribute");
    return fieldLabel(t, field, attributeLabel);
  };

  const placeholder =
    {
      [AUTO]: t("userLookupAutoPlaceholder"),
      username: t("userLookupUsernamePlaceholder"),
      email: t("userLookupEmailPlaceholder"),
      id: t("userLookupIdPlaceholder"),
    }[field] ?? t("userLookupValuePlaceholder");

  const canSubmit =
    !!value.trim() && (field !== CUSTOM || !!customKey.trim());

  const submit = () => {
    if (!canSubmit) return;
    const name = resolvedField();
    const next = addLookupFilter(
      filters,
      {
        field: name,
        value,
        label: isAttribute(name) ? attributeLabel(name) : undefined,
      },
      multi,
    );
    setValue("");
    onChange(next);
  };

  const select = (next: string) => {
    setField(next);
    setOpen(false);
  };

  return (
    <div className="pf-v5-u-display-flex pf-v5-u-flex-direction-column pf-v5-u-w-100">
      <InputGroup data-testid="user-lookup">
        <InputGroupItem>
          <Dropdown
            isOpen={open}
            onOpenChange={setOpen}
            onSelect={() => setOpen(false)}
            toggle={(ref) => (
              <MenuToggle
                ref={ref}
                data-testid="user-lookup-field"
                icon={<FilterIcon />}
                isExpanded={open}
                onClick={() => setOpen(!open)}
              >
                {toggleText()}
              </MenuToggle>
            )}
            shouldFocusToggleOnSelect
          >
            <DropdownList>
              <DropdownItem
                key={AUTO}
                description={t("userLookupAutoHelp")}
                onClick={() => select(AUTO)}
              >
                {t("userLookupAuto")}
              </DropdownItem>
              <DropdownItem key="username" onClick={() => select("username")}>
                {t("username")}
              </DropdownItem>
              <DropdownItem key="email" onClick={() => select("email")}>
                {t("email")}
              </DropdownItem>
              <DropdownItem key="id" onClick={() => select("id")}>
                {t("userLookupUserId")}
              </DropdownItem>
            </DropdownList>
            {showAttributes && (
              <>
                <Divider component="li" />
                <DropdownGroup label={t("attributes")}>
                  <DropdownList>
                    {attributes.map((a) => (
                      <DropdownItem
                        key={a.name}
                        data-testid={`user-lookup-attribute-${a.name}`}
                        onClick={() => select(a.name!)}
                      >
                        {label(t, a.displayName, a.name)}
                      </DropdownItem>
                    ))}
                    <DropdownItem key={CUSTOM} onClick={() => select(CUSTOM)}>
                      {t("userLookupCustomAttribute")}
                    </DropdownItem>
                  </DropdownList>
                </DropdownGroup>
              </>
            )}
          </Dropdown>
        </InputGroupItem>
        {field === CUSTOM && (
          <InputGroupItem>
            <TextInput
              data-testid="user-lookup-key"
              aria-label={t("userLookupAttributeKey")}
              placeholder={t("userLookupAttributeKey")}
              value={customKey}
              onChange={(_, v) => setCustomKey(v)}
            />
          </InputGroupItem>
        )}
        <InputGroupItem isFill>
          <TextInput
            data-testid="user-lookup-value"
            aria-label={t("userLookupValue")}
            placeholder={placeholder}
            value={value}
            autoComplete="off"
            spellCheck={false}
            onChange={(_, v) => setValue(v)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submit();
              }
            }}
          />
        </InputGroupItem>
        <InputGroupItem>
          <Button
            data-testid="user-lookup-submit"
            variant="control"
            isDisabled={!canSubmit}
            onClick={submit}
          >
            {multi ? t("userLookupAddFilter") : t("search")}
          </Button>
        </InputGroupItem>
      </InputGroup>
      <HelperText className="pf-v5-u-mt-xs">
        <HelperTextItem>
          {multi ? t("userLookupHelpMulti") : t("userLookupHelp")}
        </HelperTextItem>
      </HelperText>
    </div>
  );
};

type UserLookupChipsProps = {
  filters: UserLookupFilter[];
  onChange: (filters: UserLookupFilter[]) => void;
};

/** Active filters as removable chips, with a "Clear all filters" link. */
export const UserLookupChips = ({ filters, onChange }: UserLookupChipsProps) => {
  const { t } = useTranslation();
  if (!filters.length) return null;
  return (
    <div
      className="pf-v5-u-display-flex pf-v5-u-flex-wrap pf-v5-u-align-items-center pf-v5-u-mt-sm"
      data-testid="user-lookup-chips"
    >
      {filters.map((f) => (
        <ChipGroup
          key={f.field}
          className="pf-v5-u-mr-md pf-v5-u-mb-sm"
          categoryName={fieldLabel(t, f.field, () => f.label ?? f.field)}
          isClosable
          closeBtnAriaLabel={t("userLookupRemoveFilter")}
          onClick={() => onChange(filters.filter((x) => x.field !== f.field))}
        >
          <Chip isReadOnly>{f.value}</Chip>
        </ChipGroup>
      ))}
      {filters.length > 1 && (
        <Button variant="link" isInline onClick={() => onChange([])}>
          {t("clearAllFilters")}
        </Button>
      )}
    </div>
  );
};

const isAttribute = (field: string) =>
  !["username", "email", "id"].includes(field);

function fieldLabel(
  t: (key: string) => string,
  field: string,
  attributeLabel: (name: string) => string,
) {
  if (field === "username") return t("username");
  if (field === "email") return t("email");
  if (field === "id") return t("userLookupUserId");
  return attributeLabel(field);
}
