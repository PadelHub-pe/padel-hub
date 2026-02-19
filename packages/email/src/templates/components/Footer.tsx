import { Hr, Link, Text } from "@react-email/components";

interface FooterProps {
  email: string;
}

export function Footer({ email }: FooterProps) {
  return (
    <>
      <Hr style={{ borderColor: "#e5e7eb", margin: "32px 0 16px" }} />
      <Text style={{ fontSize: "12px", color: "#6b7280", margin: "0 0 4px" }}>
        PadelHub — La plataforma de pádel de Lima
      </Text>
      <Text style={{ fontSize: "12px", color: "#6b7280", margin: "0 0 4px" }}>
        <Link href="https://padelhub.pe" style={{ color: "#3B82F6" }}>
          padelhub.pe
        </Link>
        {" · "}
        <Link href="mailto:support@padelhub.pe" style={{ color: "#3B82F6" }}>
          support@padelhub.pe
        </Link>
      </Text>
      <Text style={{ fontSize: "11px", color: "#9ca3af", margin: "8px 0 0" }}>
        Este email fue enviado a {email}.
      </Text>
    </>
  );
}
