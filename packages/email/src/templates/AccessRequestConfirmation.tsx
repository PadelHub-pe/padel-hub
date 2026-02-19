import { Section, Text } from "@react-email/components";

import { Button } from "./components/Button";
import { Layout } from "./components/Layout";

interface AccessRequestConfirmationProps {
  email: string;
}

export function AccessRequestConfirmation({
  email = "contacto@example.com",
}: AccessRequestConfirmationProps) {
  return (
    <Layout preview="Recibimos tu solicitud de acceso a PadelHub" email={email}>
      <Text style={{ fontSize: "16px", color: "#111827", margin: "0 0 16px" }}>
        Hola,
      </Text>

      <Text style={{ fontSize: "14px", color: "#374151", margin: "0 0 16px" }}>
        Gracias por tu interés en PadelHub. Hemos recibido tu solicitud de
        acceso y nuestro equipo la revisará a la brevedad.
      </Text>

      <Text style={{ fontSize: "14px", color: "#374151", margin: "0 0 16px" }}>
        Nos pondremos en contacto contigo pronto con los próximos pasos para
        configurar tu cuenta y empezar a gestionar tus canchas.
      </Text>

      <Section style={{ textAlign: "center" as const, margin: "24px 0" }}>
        <Button href="https://padelhub.pe">Visitar PadelHub</Button>
      </Section>

      <Text style={{ fontSize: "13px", color: "#6b7280", margin: "0" }}>
        Si no realizaste esta solicitud, puedes ignorar este email.
      </Text>
    </Layout>
  );
}

AccessRequestConfirmation.PreviewProps = {
  email: "contacto@example.com",
} satisfies AccessRequestConfirmationProps;

export default AccessRequestConfirmation;
