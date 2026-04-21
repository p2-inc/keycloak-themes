import { useRealm } from "../../context/realm-context/RealmContext";
import { environment } from "../../environment";
import { useAuthFetch } from "../api/client";

export interface EmailTemplateMap {
  [key: string]: string;
}

export default function useStylesFetcher() {
  const { realm: realmName } = useRealm();
  const { authFetch } = useAuthFetch();

  const baseUrl = `${environment.serverBaseUrl}/realms/${realmName}`;

  async function getEmailTemplates(): Promise<EmailTemplateMap> {
    return authFetch(`${baseUrl}/emails/templates`)
      .then((r) => r.json())
      .catch(() => ({ error: "Error pulling email templates." }));
  }

  async function getEmailTemplateValue({
    templateType,
    templateName,
  }: {
    templateType: "html" | "text";
    templateName: string;
  }): Promise<{ error: boolean; message: string }> {
    return authFetch(
      `${baseUrl}/emails/templates/${templateType}/${templateName}`,
      { headers: { Accept: "text/plain" } },
    )
      .then(async (r) => {
        if (r.ok) return { error: false, message: await r.text() };
        throw new Error();
      })
      .catch(() => ({
        error: true,
        message: `Error pulling email template value for ${templateName} (${templateType})`,
      }));
  }

  async function updateEmailTemplateValue({
    templateType,
    templateName,
    templateBody,
  }: {
    templateType: "html" | "text";
    templateName: string;
    templateBody: string;
  }): Promise<{ error: boolean; message: string }> {
    const formData = new FormData();
    formData.append("template", templateBody);

    return authFetch(
      `${baseUrl}/emails/templates/${templateType}/${templateName}`,
      { method: "PUT", body: formData },
    )
      .then((r) => {
        if (r.ok) return { error: false, message: "Email template updated." };
        throw new Error();
      })
      .catch(() => ({
        error: true,
        message: `Error updating email template for ${templateName}.`,
      }));
  }

  return { getEmailTemplates, getEmailTemplateValue, updateEmailTemplateValue };
}
