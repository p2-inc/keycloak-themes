import {
  Button,
  ButtonVariant,
  Divider,
  Modal,
  ModalVariant,
} from "@patternfly/react-core";
import { useTranslation } from "react-i18next";
import { Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import useOrgFetcher, {
  PhaseTwoOrganizationMemberAttributesRepresentation,
  PhaseTwoOrganizationUserRepresentation,
} from "../useOrgFetcher";
import { useRealm } from "../../../context/realm-context/RealmContext";
import { useEffect, useState } from "react";
import { TrashAltIcon } from "@patternfly/react-icons";
import { OrgMemberAttribute } from "../form/OrgMemberAttribute";

type AssignRoleToMemberProps = {
  handleModalToggle: () => void;
  refresh: () => void;
  userId: PhaseTwoOrganizationUserRepresentation["id"];
  orgId: string;
};

export const ViewOrganizationUserAttributes = ({
  handleModalToggle,
  refresh,
  userId,
  orgId,
}: AssignRoleToMemberProps) => {
  const { realm } = useRealm();
  const { t } = useTranslation();

  const { getUserAttributesForOrgMember, updateAttributesForOrgMember } =
    useOrgFetcher(realm);

  const [userAttributes, setUserAttributes] =
    useState<PhaseTwoOrganizationMemberAttributesRepresentation | null>(null);

  const fetchUserAttributes = async () => {
    try {
      const attributes = await getUserAttributesForOrgMember(orgId, userId!);
      setUserAttributes(attributes);
    } catch (error) {
      console.error("Failed to fetch user attributes:", error);
    }
  };

  useEffect(() => {
    fetchUserAttributes();
  }, []);

  const tableRows = userAttributes
    ? Object.keys(userAttributes || {}).map((key) => ({
        name: key,
        value: userAttributes[key],
      }))
    : [];

  const columns = [
    {
      name: "name",
      displayKey: t("userOrganizationAttributeName"),
    },
    {
      name: "value",
      displayKey: t("userOrganizationAttributeValue"),
    },
  ];

  const removeAttribute = async (row: { name: string; value: string[] }) => {
    try {
      const updatedAttributes = {
        ...userAttributes,
      };
      delete updatedAttributes[row.name];
      await updateAttributesForOrgMember(orgId, userId!, updatedAttributes);
      fetchUserAttributes(); // Refresh attributes after removal
    } catch (error) {
      console.error("Failed to remove attribute:", error);
    }
  };

  const closeModal = () => {
    handleModalToggle();
    refresh();
  };

  return (
    <Modal
      variant={ModalVariant.medium}
      title={`${t("organizationUserAttributes")}: ${userAttributes?.username || t("user")}`}
      isOpen={true}
      onClose={closeModal}
      actions={[
        <Button
          id="modal-close"
          data-testid="close"
          key="close"
          variant={ButtonVariant.secondary}
          onClick={() => {
            closeModal();
          }}
        >
          {t("close")}
        </Button>,
      ]}
    >
      <Table
        aria-label="View organization attributes for a user"
        variant="compact"
      >
        <Thead>
          <Tr>
            {columns.map((c) => (
              <Th key={c.name}>{t(c.displayKey || c.name)}</Th>
            ))}
            <Th className="pf-v5-u-text-align-right"></Th>
          </Tr>
        </Thead>
        <Tbody>
          {tableRows.length === 0 ? (
            <Tr>
              <Td colSpan={3}>{t("noOrganizationUserAttributes")}</Td>
            </Tr>
          ) : (
            tableRows.map((row) => (
              <Tr key={row.name}>
                {columns.map((c) => (
                  <Td key={c.name}>{row[c.name as keyof typeof row]}</Td>
                ))}
                <Td className="pf-v5-u-text-align-right">
                  <Button
                    variant={ButtonVariant.link}
                    isDanger
                    size="sm"
                    icon={<TrashAltIcon />}
                    onClick={() => removeAttribute(row)}
                  ></Button>
                </Td>
              </Tr>
            ))
          )}
        </Tbody>
      </Table>
      <OrgMemberAttribute
        orgId={orgId}
        userId={userId!}
        userAttributes={
          userAttributes as PhaseTwoOrganizationMemberAttributesRepresentation
        }
        updateUser={fetchUserAttributes}
      />
      <Divider className="pf-v5-u-mt-md" />
    </Modal>
  );
};
