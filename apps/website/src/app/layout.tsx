import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { cn } from "@wifo/ui";
import { ThemeProvider } from "@wifo/ui/theme";
import { Toaster } from "@wifo/ui/toast";

import { env } from "~/env";
import { TRPCReactProvider } from "~/trpc/react";

import "~/app/styles.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    env.VERCEL_ENV === "production"
      ? "https://padelhub.pe"
      : "http://localhost:3001",
  ),
  title: {
    default: "PadelHub - Reserva Canchas de Padel en Lima",
    template: "%s | PadelHub",
  },
  description:
    "Descubre y reserva canchas de padel en Lima. Encuentra jugadores de tu nivel, compara precios y horarios. Miraflores, San Isidro, Surco y mas distritos.",
  keywords: [
    "padel Lima",
    "canchas de padel",
    "reservar cancha padel",
    "padel Peru",
    "jugadores padel Lima",
    "alquilar cancha padel",
    "pistas de padel Lima",
    "donde jugar padel en Lima",
    "padel cerca de mi",
    "club de padel Lima",
    "reservas padel online",
    "padel indoor Lima",
    "padel outdoor Lima",
    "horarios padel Lima",
    "precios padel Lima",
    "academias de padel Lima",
    "torneos de padel Peru",
    "alquiler canchas padel Lima",
  ],
  authors: [{ name: "PadelHub" }],
  creator: "PadelHub",
  category: "sports",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "es_PE",
    title: "PadelHub - Reserva Canchas de Padel en Lima",
    description:
      "Descubre y reserva canchas de padel en Lima. Encuentra jugadores de tu nivel, compara precios y horarios.",
    url: "https://padelhub.pe",
    siteName: "PadelHub",
  },
  twitter: {
    card: "summary_large_image",
    title: "PadelHub - Reserva Canchas de Padel en Lima",
    description:
      "Descubre y reserva canchas de padel en Lima. Encuentra jugadores de tu nivel.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  other: {
    "geo.region": "PE-LIM",
    "geo.placename": "Lima",
    "geo.position": "-12.0464;-77.0428",
    ICBM: "-12.0464, -77.0428",
  },
};

export const viewport: Viewport = {
  themeColor: [{ color: "#1d4ed8" }],
  width: "device-width",
  initialScale: 1,
};

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="es" className="light">
      <head>
        {/* Force light theme — override ThemeProvider's auto-detection */}
        <script
          dangerouslySetInnerHTML={{
            __html: `localStorage.setItem("theme-mode","light");document.documentElement.className="light";`,
          }}
        />
      </head>
      <body
        className={cn(
          "bg-background text-foreground min-h-screen font-sans antialiased",
          inter.variable,
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
