"use client";

import { useState } from "react";
import Link from "next/link";
import { addDays } from "date-fns";

import { Button } from "@wifo/ui/button";
import { Calendar, esLocale } from "@wifo/ui/calendar";

interface DateSelectorProps {
  facilitySlug: string;
}

export function DateSelector({ facilitySlug }: DateSelectorProps) {
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(today);

  // Allow booking up to 14 days in advance
  const maxDate = addDays(today, 14);

  const bookingHref = selectedDate
    ? `/${facilitySlug}/book?date=${selectedDate.toISOString().split("T")[0]}`
    : `/${facilitySlug}/book`;

  return (
    <div className="mt-6">
      <h2 className="font-display text-lg font-semibold">
        Selecciona una fecha
      </h2>

      <div className="mt-3 flex justify-center">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={setSelectedDate}
          locale={esLocale}
          disabled={[{ before: today }, { after: maxDate }]}
          defaultMonth={today}
        />
      </div>

      <div className="mt-4">
        <Button asChild className="w-full" size="lg" disabled={!selectedDate}>
          <Link href={bookingHref}>Ver disponibilidad</Link>
        </Button>
      </div>
    </div>
  );
}
