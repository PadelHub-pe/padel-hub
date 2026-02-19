import { Section, Text } from "@react-email/components";

import { Button } from "./components/Button";
import { Layout } from "./components/Layout";

interface AccessRequestApprovalProps {
  email: string;
  organizationName: string;
  activateUrl: string;
  expiresInDays: number;
}

export function AccessRequestApproval({
  email = "contacto@example.com",
  organizationName = "Padel Group Lima",
  activateUrl = "https://padelhub.pe/register?token=abc123",
  expiresInDays = 7,
}: AccessRequestApprovalProps) {
  return (
    <Layout
      preview={`Tu acceso a ${organizationName} fue aprobado`}
      email={email}
    >
      <Text style={{ fontSize: "16px", color: "#111827", margin: "0 0 16px" }}>
        Hola,
      </Text>

      <Text style={{ fontSize: "14px", color: "#374151", margin: "0 0 16px" }}>
        Tu solicitud de acceso ha sido aprobada. Tu organización{" "}
        <strong>{organizationName}</strong> ya está lista en PadelHub.
      </Text>

      <Text style={{ fontSize: "14px", color: "#374151", margin: "0 0 16px" }}>
        Activa tu cuenta para empezar a configurar tus locales, canchas y
        horarios.
      </Text>

      <Section style={{ textAlign: "center" as const, margin: "24px 0" }}>
        <Button href={activateUrl}>Activar mi Cuenta</Button>
      </Section>

      <Text style={{ fontSize: "13px", color: "#6b7280", margin: "0 0 8px" }}>
        Este enlace expira en {expiresInDays} días.
      </Text>

      <Text style={{ fontSize: "12px", color: "#9ca3af", margin: "0" }}>
        Si no solicitaste acceso a PadelHub, puedes ignorar este email.
      </Text>
    </Layout>
  );
}

AccessRequestApproval.PreviewProps = {
  email: "contacto@example.com",
  organizationName: "Padel Group Lima",
  activateUrl: "https://padelhub.pe/register?token=abc123",
  expiresInDays: 7,
} satisfies AccessRequestApprovalProps;

export default AccessRequestApproval;
