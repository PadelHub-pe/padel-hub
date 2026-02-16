"use client";

import { cn } from "@wifo/ui";

interface Player {
  id: string;
  position: number;
  role: "owner" | "player";
  userId: string | null;
  guestName: string | null;
  guestEmail: string | null;
  user: {
    name: string | null;
    email: string;
    image: string | null;
  } | null;
}

interface CourtVisualizationProps {
  players: Player[];
  court: {
    name: string;
    type: "indoor" | "outdoor";
  };
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const second = parts[1]?.[0] ?? "";
  return (first + second).toUpperCase();
}

function getPlayerName(player: Player): string {
  if (player.user?.name) return player.user.name;
  if (player.guestName) return player.guestName;
  if (player.user?.email) return player.user.email;
  if (player.guestEmail) return player.guestEmail;
  return "Jugador";
}

const typeConfig = {
  indoor: {
    label: "Indoor",
    badgeClass: "bg-blue-100 text-blue-700",
    courtGradient: "from-blue-500 to-blue-600",
  },
  outdoor: {
    label: "Outdoor",
    badgeClass: "bg-green-100 text-green-700",
    courtGradient: "from-green-500 to-green-600",
  },
};

// Positions map to grid placement:
// Top half: 1 (left), 2 (right)
// Bottom half: 3 (left), 4 (right)
const positionStyles: Record<
  number,
  { top: string; left: string }
> = {
  1: { top: "20%", left: "25%" },
  2: { top: "20%", left: "75%" },
  3: { top: "72%", left: "25%" },
  4: { top: "72%", left: "75%" },
};

export function CourtVisualization({ players, court }: CourtVisualizationProps) {
  const config = typeConfig[court.type];
  const playersByPosition = new Map(players.map((p) => [p.position, p]));

  return (
    <div className="rounded-lg border bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="text-sm font-semibold text-gray-900">{court.name}</h3>
        <span
          className={cn(
            "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
            config.badgeClass,
          )}
        >
          {config.label}
        </span>
      </div>

      {/* Court diagram */}
      <div className="p-4">
        <div
          className={cn(
            "relative mx-auto max-w-xs overflow-hidden rounded-sm border-2 border-white bg-gradient-to-b",
            config.courtGradient,
          )}
          style={{ aspectRatio: "2 / 3" }}
        >
          {/* Net - horizontal dashed line at 50% */}
          <div className="absolute left-0 right-0 top-1/2 -translate-y-px border-t-2 border-dashed border-white/80" />

          {/* Service line - top (~25%) */}
          <div className="absolute left-[10%] right-[10%] top-[37%] border-t border-white/50" />

          {/* Service line - bottom (~75%) */}
          <div className="absolute left-[10%] right-[10%] top-[63%] border-t border-white/50" />

          {/* Center service line - vertical in top half */}
          <div className="absolute left-1/2 top-[37%] h-[26%] -translate-x-px border-l border-white/50" />

          {/* Side lines */}
          <div className="absolute bottom-[8%] left-[10%] top-[8%] border-l border-white/40" />
          <div className="absolute bottom-[8%] right-[10%] top-[8%] border-r border-white/40" />

          {/* Top baseline */}
          <div className="absolute left-[10%] right-[10%] top-[8%] border-t border-white/40" />

          {/* Bottom baseline */}
          <div className="absolute bottom-[8%] left-[10%] right-[10%] border-b border-white/40" />

          {/* Player positions */}
          {[1, 2, 3, 4].map((position) => {
            const player = playersByPosition.get(position);
            const style = positionStyles[position] ?? { top: "50%", left: "50%" };

            return (
              <div
                key={position}
                className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
                style={{ top: style.top, left: style.left }}
              >
                {player ? (
                  <>
                    <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-sm font-bold text-blue-800 shadow-sm">
                      {getInitials(getPlayerName(player))}
                      {player.role === "owner" && (
                        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 shadow-sm">
                          <StarIcon className="h-2.5 w-2.5 text-amber-800" />
                        </span>
                      )}
                    </div>
                    <span className="mt-1 max-w-[5rem] truncate text-center text-xs text-white drop-shadow-sm">
                      {getPlayerName(player).split(" ")[0]}
                    </span>
                  </>
                ) : (
                  <>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-dashed border-white/50">
                      <PlusIcon className="h-4 w-4 text-white/60" />
                    </div>
                    <span className="mt-1 text-xs text-white/40">Libre</span>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
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
        d="M12 4.5v15m7.5-7.5h-15"
      />
    </svg>
  );
}
