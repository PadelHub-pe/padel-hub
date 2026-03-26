import { Badge } from "@wifo/ui/badge";
import { Separator } from "@wifo/ui/separator";

interface BookingSummaryProps {
  courtName: string;
  courtType: "indoor" | "outdoor";
  date: string;
  startTime: string;
  endTime: string;
  priceInCents: number;
  isPeakRate: boolean;
  formattedDate: string;
}

export function BookingSummary({
  courtName,
  courtType,
  startTime,
  endTime,
  priceInCents,
  isPeakRate,
  formattedDate,
}: BookingSummaryProps) {
  return (
    <div className="rounded-lg border p-4">
      <h2 className="text-sm font-semibold">Resumen de tu reserva</h2>
      <Separator className="my-3" />

      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Cancha</span>
          <div className="flex items-center gap-2">
            <span className="font-medium">{courtName}</span>
            <Badge variant="outline" className="text-xs capitalize">
              {courtType}
            </Badge>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Fecha</span>
          <span className="font-medium capitalize">{formattedDate}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Horario</span>
          <span className="font-medium">
            {startTime} – {endTime}
          </span>
        </div>

        <Separator className="my-2" />

        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Total</span>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold">
              S/ {(priceInCents / 100).toFixed(0)}
            </span>
            {isPeakRate && (
              <span className="text-xs font-medium text-orange-600 dark:text-orange-400">
                Punta
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
