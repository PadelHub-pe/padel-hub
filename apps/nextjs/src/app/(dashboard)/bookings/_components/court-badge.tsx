import { cn } from "@wifo/ui";

interface CourtBadgeProps {
  name: string;
  index?: number;
}

// Color schemes for different courts (up to 4 unique colors, then repeat)
const courtColors = [
  { bgClass: "bg-blue-100", textClass: "text-blue-700" },
  { bgClass: "bg-purple-100", textClass: "text-purple-700" },
  { bgClass: "bg-amber-100", textClass: "text-amber-700" },
  { bgClass: "bg-emerald-100", textClass: "text-emerald-700" },
];

const defaultColor = { bgClass: "bg-blue-100", textClass: "text-blue-700" };

export function CourtBadge({ name, index = 0 }: CourtBadgeProps) {
  const colorIndex = index % courtColors.length;
  const colors = courtColors[colorIndex] ?? defaultColor;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium",
        colors.bgClass,
        colors.textClass,
      )}
    >
      {name}
    </span>
  );
}
