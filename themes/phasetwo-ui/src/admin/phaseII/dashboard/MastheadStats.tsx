import { Link } from "react-router-dom";
import { UserIcon, OutlinedClockIcon, UsersIcon } from "@patternfly/react-icons";
import { useRealm } from "../../context/realm-context/RealmContext";
import { useDashboardStats } from "./useDashboardStats";
import "./dashboard-stats.css";

function fmt(value: number | null): string {
  if (value === null) return "·";
  return value.toLocaleString();
}

export const MastheadStats = () => {
  const { realm } = useRealm();
  const { stats } = useDashboardStats();
  const r = encodeURIComponent(realm);

  const items = [
    {
      icon: <UserIcon />,
      value: stats.users,
      label: "Users",
      path: `/${r}/users`,
    },
    {
      icon: <OutlinedClockIcon />,
      value: stats.activeSessions,
      label: "Sessions",
      path: `/${r}/sessions`,
    },
    {
      icon: <UsersIcon />,
      value: stats.orgs,
      label: "Organizations",
      path: `/${r}/ext-organizations`,
    },
  ];

  return (
    <div className="p2-masthead-stats">
      {items.map(({ icon, value, label, path }) => (
        <Link key={label} to={path} className="p2-masthead-stat" title={label}>
          <span className="p2-masthead-stat__icon">{icon}</span>
          <span className="p2-masthead-stat__number">{fmt(value)}</span>
        </Link>
      ))}
    </div>
  );
};
