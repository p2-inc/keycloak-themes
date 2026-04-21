import { Link } from "react-router-dom";
import { useRealm } from "../../context/realm-context/RealmContext";
import { useDashboardStats } from "./useDashboardStats";
import "./dashboard-stats.css";

function fmt(value: number | null, capped?: boolean): string {
  if (value === null) return "·";
  if (capped) return `${value}+`;
  return value.toLocaleString();
}

export const SidebarStatsBox = () => {
  const { realm } = useRealm();
  const { stats } = useDashboardStats();
  const r = encodeURIComponent(realm);

  const items = [
    { label: "Users", value: stats.users, path: `/${r}/users` },
    { label: "Sessions", value: stats.activeSessions, path: `/${r}/sessions` },
    { label: "Organizations", value: stats.orgs, path: `/${r}/ext-organizations` },
    {
      label: "Clients",
      value: stats.clients,
      capped: stats.clientsCapped,
      path: `/${r}/clients`,
    },
  ];

  return (
    <div className="p2-sidebar-stats">
      <span className="p2-sidebar-stats__title">Overview</span>
      {items.map(({ label, value, capped, path }) => (
        <Link key={label} to={path} className="p2-sidebar-stat">
          <span className="p2-sidebar-stat__label">{label}</span>
          <span className="p2-sidebar-stat__number">{fmt(value, capped)}</span>
        </Link>
      ))}
    </div>
  );
};
