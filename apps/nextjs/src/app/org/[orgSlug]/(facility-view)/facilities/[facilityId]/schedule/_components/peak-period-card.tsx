"use client";

import { Button } from "@wifo/ui/button";

interface PeakPeriod {
  id: string;
  name: string;
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
  markupPercent: number;
}

interface PeakPeriodCardProps {
  period: PeakPeriod;
  onDelete: () => void;
  isDeleting: boolean;
}

const dayLabels = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];

export function PeakPeriodCard({
  period,
  onDelete,
  isDeleting,
}: PeakPeriodCardProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border bg-amber-50 px-4 py-3">
      <div className="flex-1">
        <div className="flex items-center gap-3">
          <span className="font-medium text-gray-900">{period.name}</span>
          <span className="rounded bg-amber-200 px-2 py-0.5 text-xs font-medium text-amber-800">
            +{period.markupPercent}%
          </span>
        </div>
        <div className="mt-1 flex items-center gap-3">
          <span className="text-sm text-gray-600">
            {period.startTime} - {period.endTime}
          </span>
          <div className="flex gap-1">
            {dayLabels.map((label, index) => (
              <span
                key={index}
                className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                  period.daysOfWeek.includes(index)
                    ? "bg-amber-200 text-amber-800"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-gray-400 hover:text-red-500"
        onClick={onDelete}
        disabled={isDeleting}
      >
        <TrashIcon className="h-4 w-4" />
      </Button>
    </div>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
      />
    </svg>
  );
}
