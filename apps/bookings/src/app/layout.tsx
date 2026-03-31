import type { Metadata, Viewport } from "next";
import { DM_Sans, Geist_Mono, Sora } from "next/font/google";

import { cn } from "@wifo/ui";
import { ThemeProvider } from "@wifo/ui/theme";
import { Toaster } from "@wifo/ui/toast";

import { env } from "~/env";
import { TRPCReactProvider } from "~/trpc/react";

import "~/app/styles.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    env.VERCEL_ENV === "production"
      ? "https://bookings.padelhub.pe"
      : "http://localhost:3002",
  ),
  title: "Reserva tu cancha | PadelHub",
  description:
    "Reserva canchas de p\u00e1del online. Disponibilidad en tiempo real, reserva instant\u00e1nea.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/favicon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});
const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
});
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={cn(
          "bg-background text-foreground min-h-screen font-sans antialiased",
          dmSans.variable,
          sora.variable,
          geistMono.variable,
        )}
      >
        <ThemeProvider>
          <TRPCReactProvider>{props.children}</TRPCReactProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
