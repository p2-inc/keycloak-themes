import { useEffect, useState } from "react";
import { useAdminClient } from "../../admin-client";
import { useRealm } from "../../context/realm-context/RealmContext";
import { fetchAdminUI } from "../../context/auth/admin-ui-endpoint";
import { usePhaseTwoClient } from "../api/client";

type SessionStats = {
  active: number;
  offline: number;
  clientSessions: number;
  offlineClientSessions: number;
};

export type DashboardStats = {
  users: number | null;
  clients: number | null;
  clientsCapped: boolean;
  activeSessions: number | null;
  offlineSessions: number | null;
  orgs: number | null;
  idps: number | null;
  groups: number | null;
};

const INITIAL: DashboardStats = {
  users: null,
  clients: null,
  clientsCapped: false,
  activeSessions: null,
  offlineSessions: null,
  orgs: null,
  idps: null,
  groups: null,
};

export function useDashboardStats(): {
  stats: DashboardStats;
  loading: boolean;
} {
  const { adminClient } = useAdminClient();
  const { realm } = useRealm();
  const phaseTwoClient = usePhaseTwoClient();
  const [stats, setStats] = useState<DashboardStats>(INITIAL);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setStats(INITIAL);

    const CLIENT_CAP = 100;

    Promise.allSettled([
      adminClient.users.count(),
      adminClient.clients.find({ briefRepresentation: true, max: CLIENT_CAP + 1 } as Parameters<typeof adminClient.clients.find>[0]),
      fetchAdminUI<SessionStats>(adminClient, "sessions/stats"),
      phaseTwoClient.GET("/{realm}/orgs/count", { params: { path: { realm } } }),
      adminClient.identityProviders.find({ first: 0, max: 100 }),
      adminClient.groups.count(),
    ]).then(([users, clients, sessions, orgs, idps, groups]) => {
      setStats({
        users: users.status === "fulfilled" ? users.value : null,
        clients:
          clients.status === "fulfilled"
            ? Math.min(clients.value.length, CLIENT_CAP)
            : null,
        clientsCapped:
          clients.status === "fulfilled" &&
          clients.value.length > CLIENT_CAP,
        activeSessions:
          sessions.status === "fulfilled" ? sessions.value.active : null,
        offlineSessions:
          sessions.status === "fulfilled" ? sessions.value.offline : null,
        orgs:
          orgs.status === "fulfilled" && typeof orgs.value.data === "number"
            ? orgs.value.data
            : null,
        idps: idps.status === "fulfilled" ? idps.value.length : null,
        groups:
          groups.status === "fulfilled"
            ? (groups.value.count ?? null)
            : null,
      });
      setLoading(false);
    });
  }, [realm]); // eslint-disable-line react-hooks/exhaustive-deps

  return { stats, loading };
}
