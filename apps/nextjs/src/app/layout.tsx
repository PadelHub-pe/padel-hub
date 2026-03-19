import type { Metadata, Viewport } from "next";
import { DM_Sans, Geist_Mono, Sora } from "next/font/google";

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
    images: [{ url: "/images/og-image.png", width: 1200, height: 630 }],
  },
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
    <html lang="en" suppressHydrationWarning>
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
          <div className="absolute right-4 bottom-4">
            <ThemeToggle />
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
