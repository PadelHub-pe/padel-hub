import { Section, Text } from "@react-email/components";

import { Button } from "./components/Button";
import { Layout } from "./components/Layout";

interface PasswordResetProps {
  userEmail: string;
  resetUrl: string;
  expiresInMinutes: number;
}

export function PasswordReset({
  userEmail = "usuario@example.com",
  resetUrl = "https://padelhub.pe/reset-password?token=abc123",
  expiresInMinutes = 60,
}: PasswordResetProps) {
  return (
    <Layout preview="Restablece tu contraseña de PadelHub" email={userEmail}>
      <Text style={{ fontSize: "16px", color: "#111827", margin: "0 0 16px" }}>
        Hola,
      </Text>

      <Text style={{ fontSize: "14px", color: "#374151", margin: "0 0 16px" }}>
        Recibimos una solicitud para restablecer la contraseña de tu cuenta en
        PadelHub.
      </Text>

      <Section style={{ textAlign: "center" as const, margin: "24px 0" }}>
        <Button href={resetUrl}>Restablecer Contraseña</Button>
      </Section>

      <Text style={{ fontSize: "13px", color: "#6b7280", margin: "0 0 8px" }}>
        Este enlace expira en {expiresInMinutes} minutos.
      </Text>

      <Text style={{ fontSize: "12px", color: "#9ca3af", margin: "0" }}>
        Si no solicitaste restablecer tu contraseña, puedes ignorar este email.
        Tu contraseña no cambiará.
      </Text>
    </Layout>
  );
}

PasswordReset.PreviewProps = {
  userEmail: "usuario@example.com",
  resetUrl: "https://padelhub.pe/reset-password?token=abc123",
  expiresInMinutes: 60,
} satisfies PasswordResetProps;

export default PasswordReset;
