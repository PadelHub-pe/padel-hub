import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

import { cn } from "@wifo/ui";

type ActivityType =
  | "created"
  | "confirmed"
  | "player_joined"
  | "player_left"
  | "status_changed"
  | "modified"
  | "started"
  | "completed"
  | "cancelled";

interface Activity {
  id: string;
  type: ActivityType;
  description: string;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  performer: { name: string | null; email: string } | null;
}

interface ActivityTimelineProps {
  activities: Activity[];
}

const dotColorByType: Record<ActivityType, string> = {
  created: "bg-blue-500",
  confirmed: "bg-green-500",
  player_joined: "bg-green-500",
  completed: "bg-green-500",
  player_left: "bg-red-500",
  cancelled: "bg-red-500",
  status_changed: "bg-amber-500",
  started: "bg-amber-500",
  modified: "bg-amber-500",
};

export function ActivityTimeline({ activities }: ActivityTimelineProps) {
  return (
    <section>
      <div className="mb-4 flex items-center gap-2">
        <TimelineIcon className="h-5 w-5 text-gray-500" />
        <h3 className="text-sm font-semibold text-gray-900">Actividad</h3>
      </div>

      {activities.length === 0 ? (
        <p className="text-sm text-gray-500">Sin actividad</p>
      ) : (
        <div className="relative ml-1.5">
          {/* Vertical timeline line */}
          <div className="absolute top-1.5 bottom-1.5 left-[5px] w-px bg-gray-200" />

          <ul className="space-y-4">
            {activities.map((activity) => (
              <li key={activity.id} className="relative flex gap-3">
                {/* Dot */}
                <div
                  className={cn(
                    "relative z-10 mt-1.5 h-3 w-3 shrink-0 rounded-full",
                    dotColorByType[activity.type],
                  )}
                />

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-900">
                    {activity.description}
                  </p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-gray-500">
                    {activity.performer && (
                      <span>{activity.performer.name}</span>
                    )}
                    <span>
                      {formatDistanceToNow(new Date(activity.createdAt), {
                        addSuffix: true,
                        locale: es,
                      })}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function TimelineIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
      />
    </svg>
  );
}
