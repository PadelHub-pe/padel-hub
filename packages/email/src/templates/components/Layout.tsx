import { Body, Container, Head, Html, Preview } from "@react-email/components";

import { Footer } from "./Footer";
import { Header } from "./Header";

interface LayoutProps {
  preview: string;
  email: string;
  children: React.ReactNode;
}

export function Layout({ preview, email, children }: LayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body
        style={{
          backgroundColor: "#f9fafb",
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          margin: "0",
          padding: "0",
        }}
      >
        <Container
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            margin: "40px auto",
            padding: "32px",
            maxWidth: "560px",
          }}
        >
          <Header />
          {children}
          <Footer email={email} />
        </Container>
      </Body>
    </Html>
  );
}
