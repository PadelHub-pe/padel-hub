"use client";

import { useCallback, useRef, useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";

import { Button } from "@wifo/ui/button";
import { Input } from "@wifo/ui/input";
import { toast } from "@wifo/ui/toast";

import { useTRPC } from "~/trpc/react";

const BOOKINGS_BASE_URL = "https://bookings.padelhub.pe";

interface BookingLinkTabProps {
  facilityId: string;
}

export function BookingLinkTab({ facilityId }: BookingLinkTabProps) {
  const trpc = useTRPC();
  const { data: facility } = useSuspenseQuery(
    trpc.facility.getProfile.queryOptions({ facilityId }),
  );

  const bookingUrl = facility.slug
    ? `${BOOKINGS_BASE_URL}/${facility.slug}`
    : null;

  if (!bookingUrl) {
    return (
      <div className="max-w-2xl">
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-6">
          <h3 className="text-sm font-semibold text-amber-900">
            Enlace no disponible
          </h3>
          <p className="mt-1 text-sm text-amber-700">
            Tu local no tiene un slug configurado. Completa la configuración del
            local para generar el enlace de reservas.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">
          Enlace de Reservas
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Comparte este enlace con tus jugadores para que puedan reservar
          canchas en línea.
        </p>
      </div>

      <ShareableUrl url={bookingUrl} />
      <QrCodeSection url={bookingUrl} facilityName={facility.name} />
    </div>
  );
}

function ShareableUrl({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Enlace copiado al portapapeles");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("No se pudo copiar el enlace");
    }
  }, [url]);

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-6">
      <h3 className="mb-3 text-sm font-semibold text-gray-900">
        URL de reservas
      </h3>
      <div className="flex gap-2">
        <Input value={url} readOnly className="bg-white font-mono text-sm" />
        <Button
          type="button"
          variant={copied ? "outline" : "default"}
          onClick={handleCopy}
          className="shrink-0"
        >
          {copied ? "Copiado" : "Copiar"}
        </Button>
      </div>
      <p className="mt-2 text-xs text-gray-500">
        Los jugadores pueden acceder a esta página para ver disponibilidad y
        reservar canchas.
      </p>
    </div>
  );
}

function QrCodeSection({
  url,
  facilityName,
}: {
  url: string;
  facilityName: string;
}) {
  const qrRef = useRef<HTMLDivElement>(null);

  const handleDownload = useCallback(() => {
    const svgElement = qrRef.current?.querySelector("svg");
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      const link = document.createElement("a");
      link.download = `qr-${facilityName.toLowerCase().replace(/\s+/g, "-")}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
  }, [facilityName]);

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-6">
      <h3 className="mb-3 text-sm font-semibold text-gray-900">Código QR</h3>
      <p className="mb-4 text-sm text-gray-500">
        Imprime este código QR y colócalo en tu local para que los jugadores
        puedan escanear y reservar directamente.
      </p>
      <div className="flex flex-col items-center gap-4 rounded-lg bg-white p-6">
        <div ref={qrRef}>
          <QRCodeSVG value={url} size={200} level="M" marginSize={2} />
        </div>
        <p className="text-center text-xs text-gray-400">{url}</p>
      </div>
      <div className="mt-4">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleDownload}
        >
          Descargar QR como imagen
        </Button>
      </div>
    </div>
  );
}
