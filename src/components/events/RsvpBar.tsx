import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { useGroupContext } from "@/lib/UserContext";

interface Props {
  channelId: Id<"channels">;
}

const STATUSES = [
  { value: "going" as const, label: "Going", color: "bg-accent-hangout/20 text-accent-hangout border-accent-hangout/40" },
  { value: "maybe" as const, label: "Maybe", color: "bg-accent-event/20 text-accent-event border-accent-event/40" },
  { value: "not_going" as const, label: "Can't", color: "bg-text-tertiary/20 text-text-secondary border-text-tertiary/40" },
];

export function RsvpBar({ channelId }: Props) {
  const { currentUser } = useGroupContext();
  const rsvps = useQuery(api.events.getRsvps, { channelId });
  const setRsvp = useMutation(api.events.setRsvp);

  const myRsvp = rsvps?.find((r) => r.userId === currentUser._id);

  return (
    <div className="flex gap-2">
      {STATUSES.map(({ value, label, color }) => {
        const count = rsvps?.filter((r) => r.status === value).length ?? 0;
        const isSelected = myRsvp?.status === value;
        return (
          <button
            key={value}
            onClick={() => setRsvp({ channelId, status: value })}
            className={cn(
              "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
              isSelected
                ? color
                : "border-border text-text-tertiary hover:border-border-focus hover:text-text-secondary"
            )}
          >
            {label}
            {count > 0 && (
              <span className="font-mono text-xs">{count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
