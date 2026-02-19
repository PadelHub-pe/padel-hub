import type { Metadata, Viewport } from "next";
import { Geist_Mono, Inter } from "next/font/google";

import { cn } from "@wifo/ui";
import { ThemeProvider, ThemeToggle } from "@wifo/ui/theme";
import { Toaster } from "@wifo/ui/toast";

import { env } from "~/env";
import { TRPCReactProvider } from "~/trpc/react";

import "~/app/styles.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    env.VERCEL_ENV === "production"
      ? "https://dashboard.padelhub.pe"
      : "http://localhost:3000",
  ),
  title: "PadelHub - Court Owner Dashboard",
  description:
    "Manage your padel courts, bookings, and grow your business with PadelHub",
  openGraph: {
    title: "PadelHub - Court Owner Dashboard",
    description:
      "Manage your padel courts, bookings, and grow your business with PadelHub",
    url: "https://dashboard.padelhub.pe",
    siteName: "PadelHub",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "bg-background text-foreground min-h-screen font-sans antialiased",
          inter.variable,
          geistMono.variable,
        )}
      >
        <ThemeProvider>
          <TRPCReactProvider>{props.children}</TRPCReactProvider>
          <div className="absolute right-4 bottom-4">
            <ThemeToggle />
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
