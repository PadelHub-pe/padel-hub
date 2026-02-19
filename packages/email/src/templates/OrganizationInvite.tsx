import { Section, Text } from "@react-email/components";

import { Button } from "./components/Button";
import { Layout } from "./components/Layout";

const ROLE_LABELS: Record<string, string> = {
  org_admin: "Administrador",
  facility_manager: "Manager de Local",
  staff: "Staff",
};

interface OrganizationInviteProps {
  inviteeEmail: string;
  organizationName: string;
  inviterName: string;
  role: string;
  facilityNames?: string[];
  inviteUrl: string;
  expiresInDays: number;
}

export function OrganizationInvite({
  inviteeEmail = "invitado@example.com",
  organizationName = "Padel Group Lima",
  inviterName = "Juan Pérez",
  role = "org_admin",
  facilityNames,
  inviteUrl = "https://padelhub.pe/register?token=abc123",
  expiresInDays = 7,
}: OrganizationInviteProps) {
  const roleLabel = ROLE_LABELS[role] ?? role;
  const subject = `${inviterName} te invitó a ${organizationName} en PadelHub`;

  return (
    <Layout preview={subject} email={inviteeEmail}>
      <Text style={{ fontSize: "16px", color: "#111827", margin: "0 0 16px" }}>
        Hola,
      </Text>

      <Text style={{ fontSize: "14px", color: "#374151", margin: "0 0 16px" }}>
        <strong>{inviterName}</strong> te ha invitado a unirte a{" "}
        <strong>{organizationName}</strong> en PadelHub como{" "}
        <strong>{roleLabel}</strong>.
      </Text>

      {facilityNames && facilityNames.length > 0 && (
        <Text
          style={{ fontSize: "14px", color: "#374151", margin: "0 0 16px" }}
        >
          Locales asignados: <strong>{facilityNames.join(", ")}</strong>
        </Text>
      )}

      <Section style={{ textAlign: "center" as const, margin: "24px 0" }}>
        <Button href={inviteUrl}>Aceptar Invitación</Button>
      </Section>

      <Text style={{ fontSize: "13px", color: "#6b7280", margin: "0 0 8px" }}>
        Esta invitación expira en {expiresInDays} días.
      </Text>

      <Text style={{ fontSize: "12px", color: "#9ca3af", margin: "0" }}>
        Si no esperabas esta invitación, puedes ignorar este email.
      </Text>
    </Layout>
  );
}

OrganizationInvite.PreviewProps = {
  inviteeEmail: "invitado@example.com",
  organizationName: "Padel Group Lima",
  inviterName: "Juan Pérez",
  role: "facility_manager",
  facilityNames: ["Sede Miraflores", "Sede San Isidro"],
  inviteUrl: "https://padelhub.pe/register?token=abc123",
  expiresInDays: 7,
} satisfies OrganizationInviteProps;

export default OrganizationInvite;
