import { Button as EmailButton } from "@react-email/components";

interface ButtonProps {
  href: string;
  children: React.ReactNode;
}

export function Button({ href, children }: ButtonProps) {
  return (
    <EmailButton
      href={href}
      style={{
        backgroundColor: "#3B82F6",
        color: "#ffffff",
        fontSize: "14px",
        fontWeight: 600,
        textDecoration: "none",
        textAlign: "center" as const,
        display: "inline-block",
        padding: "12px 24px",
        borderRadius: "6px",
      }}
    >
      {children}
    </EmailButton>
  );
}
