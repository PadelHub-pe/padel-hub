"use client";

interface CalendarLinkProps {
  facilityName: string;
  courtName: string;
  date: string;
  startTime: string;
  endTime: string;
}

function toGoogleCalendarUrl({
  facilityName,
  courtName,
  date,
  startTime,
  endTime,
}: CalendarLinkProps): string {
  const title = `Pádel en ${facilityName}`;
  const details = `Reserva en ${courtName} - ${facilityName}`;

  // Convert date (YYYY-MM-DD) + time (HH:MM) to Google Calendar format (YYYYMMDDTHHMMSS)
  const dateClean = date.replace(/-/g, "");
  const startClean = startTime.replace(":", "") + "00";
  const endClean = endTime.replace(":", "") + "00";

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${dateClean}T${startClean}/${dateClean}T${endClean}`,
    details,
    ctz: "America/Lima",
  });

  return `https://www.google.com/calendar/render?${params.toString()}`;
}

export function CalendarLink(props: CalendarLinkProps) {
  const url = toGoogleCalendarUrl(props);

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Agregar al calendario de Google"
      className="border-border hover:bg-muted inline-flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
      Agregar al calendario
    </a>
  );
}
