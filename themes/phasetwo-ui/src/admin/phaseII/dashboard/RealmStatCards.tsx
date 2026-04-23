import { Card, CardBody, Grid, GridItem } from "@patternfly/react-core";
import { Link } from "react-router-dom";
import { useRealm } from "../../context/realm-context/RealmContext";
import type { DashboardStats } from "./useDashboardStats";

type StatCardProps = {
  label: string;
  value: number | null;
  capped?: boolean;
  path: string;
  realm: string;
};

function formatValue(value: number | null, capped?: boolean): string {
  if (value === null) return "—";
  if (capped) return `${value}+`;
  return value.toLocaleString();
}

const StatCard = ({ label, value, capped, path, realm }: StatCardProps) => (
  <Card isFullHeight>
    <CardBody>
      <Link
        to={`/${encodeURIComponent(realm)}${path}`}
        style={{ textDecoration: "none", color: "inherit" }}
      >
        <div className="p2-stat-card">
          <span className="p2-stat-number">{formatValue(value, capped)}</span>
          <span className="p2-stat-label">{label}</span>
        </div>
      </Link>
    </CardBody>
  </Card>
);

type RealmStatCardsProps = {
  stats: DashboardStats;
};

export const RealmStatCards = ({ stats }: RealmStatCardsProps) => {
  const { realm } = useRealm();

  const cards = [
    { label: "Users", value: stats.users, path: "/users" },
    {
      label: "Clients",
      value: stats.clients,
      capped: stats.clientsCapped,
      path: "/clients",
    },
    { label: "Active Sessions", value: stats.activeSessions, path: "/sessions" },
    { label: "Organizations", value: stats.orgs, path: "/ext-organizations" },
    {
      label: "Identity Providers",
      value: stats.idps,
      path: "/identity-providers",
    },
    { label: "Groups", value: stats.groups, path: "/groups" },
  ];

  return (
    <Grid hasGutter>
      {cards.map(({ label, value, capped, path }) => (
        <GridItem key={label} lg={2} md={4} sm={6}>
          <StatCard
            label={label}
            value={value}
            capped={capped}
            path={path}
            realm={realm}
          />
        </GridItem>
      ))}
    </Grid>
  );
};
