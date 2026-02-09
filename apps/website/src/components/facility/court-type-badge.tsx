import { Badge } from "@wifo/ui/badge";

export function CourtTypeBadge({ type }: { type: string }) {
  if (type === "indoor") {
    return (
      <Badge variant="secondary" className="text-xs">
        Indoor
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="text-xs">
      Outdoor
    </Badge>
  );
}
