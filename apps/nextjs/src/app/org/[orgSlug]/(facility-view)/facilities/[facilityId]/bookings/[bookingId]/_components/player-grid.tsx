"use client";

import { useState } from "react";
import { cn } from "@wifo/ui";

import { AddPlayerDialog } from "./add-player-dialog";
import { RemovePlayerDialog } from "./remove-player-dialog";

interface Player {
  id: string;
  position: number;
  role: "owner" | "player";
  userId: string | null;
  guestName: string | null;
  guestEmail: string | null;
  guestPhone: string | null;
  user: {
    name: string;
    email: string;
    image: string | null;
  } | null;
}

interface PlayerGridProps {
  players: Player[];
  bookingId: string;
  bookingStatus: string;
  onPlayerChanged: () => void;
}

const POSITION_COLORS: Record<
  number,
  { border: string; bg: string; text: string }
> = {
  1: {
    border: "border-l-blue-500",
    bg: "bg-blue-100",
    text: "text-blue-700",
  },
  2: {
    border: "border-l-green-500",
    bg: "bg-green-100",
    text: "text-green-700",
  },
  3: {
    border: "border-l-amber-500",
    bg: "bg-amber-100",
    text: "text-amber-700",
  },
  4: {
    border: "border-l-purple-500",
    bg: "bg-purple-100",
    text: "text-purple-700",
  },
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase();
}

export function PlayerGrid({
  players,
  bookingId,
  bookingStatus,
  onPlayerChanged,
}: PlayerGridProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addPosition, setAddPosition] = useState<number | null>(null);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [removePlayer, setRemovePlayer] = useState<Player | null>(null);

  const playersByPosition = new Map<number, Player>();
  for (const player of players) {
    playersByPosition.set(player.position, player);
  }

  const filledCount = players.length;

  const handleAddClick = (position: number) => {
    setAddPosition(position);
    setShowAddDialog(true);
  };

  const handleRemoveClick = (player: Player) => {
    setRemovePlayer(player);
    setShowRemoveDialog(true);
  };

  return (
    <>
      <section>
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Jugadores</h3>
          <span className="text-sm font-medium text-gray-500">
            {filledCount}/4
          </span>
        </div>

        {/* 2x2 Grid */}
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((position) => {
            const player = playersByPosition.get(position);
            const colors = POSITION_COLORS[position] ?? {
              border: "border-l-blue-500",
              bg: "bg-blue-100",
              text: "text-blue-700",
            };

            if (player) {
              const displayName =
                player.user?.name ?? player.guestName ?? "Sin nombre";
              const displayContact =
                player.user?.email ?? player.guestEmail ?? player.guestPhone;

              return (
                <div
                  key={position}
                  className={cn(
                    "relative rounded-lg border border-l-4 bg-white p-4",
                    colors.border,
                  )}
                >
                  {/* Remove button (not for owner) */}
                  {player.role !== "owner" && (
                    <button
                      onClick={() => handleRemoveClick(player)}
                      className="absolute right-2 top-2 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                      aria-label={`Eliminar jugador de posicion ${position}`}
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  )}

                  {/* Position label */}
                  <p className="mb-2 text-xs text-gray-400">
                    Posicion {position}
                  </p>

                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                        colors.bg,
                        colors.text,
                      )}
                    >
                      {getInitials(displayName)}
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium text-gray-900">
                          {displayName}
                        </p>
                        {player.role === "owner" && (
                          <span className="inline-flex shrink-0 items-center rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-700">
                            Dueno
                          </span>
                        )}
                      </div>
                      {displayContact && (
                        <p className="truncate text-xs text-gray-500">
                          {displayContact}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            }

            // Empty slot
            return (
              <button
                key={position}
                onClick={() => handleAddClick(position)}
                className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-4 transition-colors hover:border-gray-400 hover:bg-gray-100"
              >
                <p className="mb-2 text-xs text-gray-400">
                  Posicion {position}
                </p>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-gray-400">
                  <svg
                    className="h-5 w-5"
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
                </div>
                <p className="mt-2 text-sm text-gray-500">Agregar jugador</p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Add Player Dialog */}
      <AddPlayerDialog
        open={showAddDialog}
        position={addPosition}
        bookingId={bookingId}
        bookingStatus={bookingStatus}
        onClose={() => {
          setShowAddDialog(false);
          setAddPosition(null);
        }}
        onPlayerAdded={() => {
          setShowAddDialog(false);
          setAddPosition(null);
          onPlayerChanged();
        }}
      />

      {/* Remove Player Dialog */}
      <RemovePlayerDialog
        open={showRemoveDialog}
        player={removePlayer}
        bookingId={bookingId}
        onClose={() => {
          setShowRemoveDialog(false);
          setRemovePlayer(null);
        }}
        onPlayerRemoved={() => {
          setShowRemoveDialog(false);
          setRemovePlayer(null);
          onPlayerChanged();
        }}
      />
    </>
  );
}
