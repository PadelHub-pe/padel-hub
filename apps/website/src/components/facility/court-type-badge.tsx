export function CourtTypeBadge({ type }: { type: string }) {
  if (type === "indoor") {
    return (
      <span className="rounded-md bg-black/60 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
        Indoor
      </span>
    );
  }

  return (
    <span className="rounded-md bg-white/70 px-2 py-0.5 text-xs font-medium text-gray-900 backdrop-blur-sm">
      Outdoor
    </span>
  );
}
