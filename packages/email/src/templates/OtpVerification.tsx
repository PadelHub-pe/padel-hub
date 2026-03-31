import { Section, Text } from "@react-email/components";

import { Layout } from "./components/Layout";

interface OtpVerificationProps {
  email: string;
  code: string;
  expiresInMinutes: number;
}

export function OtpVerification({
  email = "jugador@example.com",
  code = "123456",
  expiresInMinutes = 10,
}: OtpVerificationProps) {
  return (
    <Layout preview="Tu código de verificación de PadelHub" email={email}>
      <Text style={{ fontSize: "16px", color: "#111827", margin: "0 0 16px" }}>
        Hola,
      </Text>

      <Text style={{ fontSize: "14px", color: "#374151", margin: "0 0 16px" }}>
        Usa el siguiente código para verificar tu identidad y completar tu
        reserva en PadelHub:
      </Text>

      <Section style={{ textAlign: "center" as const, margin: "24px 0" }}>
        <Text
          style={{
            fontSize: "32px",
            fontWeight: "bold",
            letterSpacing: "8px",
            color: "#111827",
            margin: "0",
            fontFamily: "monospace",
          }}
        >
          {code}
        </Text>
      </Section>

      <Text style={{ fontSize: "13px", color: "#6b7280", margin: "0 0 8px" }}>
        Este código expira en {expiresInMinutes} minutos.
      </Text>

      <Text style={{ fontSize: "12px", color: "#9ca3af", margin: "0" }}>
        Si no solicitaste este código, puedes ignorar este email.
      </Text>
    </Layout>
  );
}

OtpVerification.PreviewProps = {
  email: "jugador@example.com",
  code: "123456",
  expiresInMinutes: 10,
} satisfies OtpVerificationProps;

export default OtpVerification;
