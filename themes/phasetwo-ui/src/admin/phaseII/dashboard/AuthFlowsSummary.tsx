import { Card, CardBody, CardTitle } from "@patternfly/react-core";
import { Link } from "react-router-dom";
import { useRealm } from "../../context/realm-context/RealmContext";
import type RealmRepresentation from "@keycloak/keycloak-admin-client/lib/defs/realmRepresentation";
import "./dashboard-stats.css";

const FLOW_LABELS: {
  key: keyof RealmRepresentation;
  label: string;
}[] = [
  { key: "browserFlow", label: "Browser" },
  { key: "directGrantFlow", label: "Direct grant" },
  { key: "registrationFlow", label: "Registration" },
  { key: "resetCredentialsFlow", label: "Reset credentials" },
  { key: "clientAuthenticationFlow", label: "Client auth" },
  { key: "dockerAuthenticationFlow", label: "Docker" },
];

export const AuthFlowsSummary = () => {
  const { realm, realmRepresentation } = useRealm();
  const authPath = `/${encodeURIComponent(realm)}/authentication`;

  if (!realmRepresentation) return null;

  const defined = FLOW_LABELS.filter(
    ({ key }) => realmRepresentation[key] as string | undefined,
  );

  return (
    <Card>
      <CardTitle>
        <Link to={authPath} style={{ textDecoration: "none", color: "inherit" }}>
          Authentication Flows
        </Link>
      </CardTitle>
      <CardBody>
        <div className="p2-flow-badges">
          {defined.map(({ key, label }) => {
            const value = realmRepresentation[key] as string;
            return (
              <Link key={key} to={authPath} className="p2-flow-badge">
                <span className="p2-flow-badge__label">{label}</span>
                <span className="p2-flow-badge__value">{value}</span>
              </Link>
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
};
