import { useMemo } from "react";
import createClient from "openapi-fetch";
import type { paths, components } from "./phasetwo-schema.d.ts";
import { useAdminClient } from "../../admin-client";
import { useEnvironment } from "@/shared/keycloak-ui-shared";
import type { Environment } from "../../environment";

export type { components };
export type PhaseTwoClient = ReturnType<typeof createClient<paths>>;

/**
 * Returns a typed openapi-fetch client scoped to the PhaseTwoAPI.
 * Base URL is set to `{serverBaseUrl}/realms` so all spec paths (/{realm}/...)
 * resolve correctly. A middleware injects a fresh Bearer token on every request.
 */
export function usePhaseTwoClient(): PhaseTwoClient {
  const { environment } = useEnvironment<Environment>();
  const { adminClient } = useAdminClient();

  return useMemo(() => {
    const client = createClient<paths>({
      baseUrl: `${environment.serverBaseUrl}/realms`,
    });

    client.use({
      async onRequest({ request }) {
        const token = await adminClient.getAccessToken();
        if (token) request.headers.set("Authorization", `Bearer ${token}`);
        return request;
      },
    });

    return client;
  }, [environment.serverBaseUrl, adminClient]);
}

/**
 * Returns an authenticated fetch helper for endpoints not covered by the
 * OpenAPI spec (e.g. email template endpoints).
 */
export function useAuthFetch() {
  const { adminClient } = useAdminClient();

  async function authFetch(
    url: string,
    init: RequestInit = {},
  ): Promise<Response> {
    const token = await adminClient.getAccessToken();
    return fetch(url, {
      ...init,
      mode: "cors",
      cache: "no-cache",
      redirect: "follow",
      headers: {
        ...(init.headers as Record<string, string>),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  }

  return { authFetch };
}
