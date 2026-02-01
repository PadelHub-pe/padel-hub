import { cn } from "@wifo/ui";
import { Card, CardContent } from "@wifo/ui/card";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  iconColor?: "blue" | "green" | "amber" | "purple";
  prefix?: string;
  suffix?: string;
}

const iconColorClasses = {
  blue: "bg-blue-100 text-blue-600",
  green: "bg-green-100 text-green-600",
  amber: "bg-amber-100 text-amber-600",
  purple: "bg-purple-100 text-purple-600",
};

export function StatCard({
  title,
  value,
  change,
  icon,
  iconColor = "blue",
  prefix,
  suffix,
}: StatCardProps) {
  const isPositive = change !== undefined && change >= 0;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg",
              iconColorClasses[iconColor],
            )}
          >
            {icon}
          </div>
          {change !== undefined && (
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                isPositive
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700",
              )}
            >
              {isPositive ? "+" : ""}
              {change.toFixed(1)}%
            </span>
          )}
        </div>
        <div className="mt-4">
          <p className="text-sm text-gray-500">{title}</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">
            {prefix}
            {typeof value === "number" ? value.toLocaleString("es-PE") : value}
            {suffix}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
