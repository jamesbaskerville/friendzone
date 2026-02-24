import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { useGroupContext } from "@/lib/UserContext";

interface Props {
  channelId: Id<"channels">;
}

export function Checklist({ channelId }: Props) {
  const { memberMap } = useGroupContext();
  const items = useQuery(api.events.getChecklist, { channelId });
  const addItem = useMutation(api.events.addChecklistItem);
  const claimItem = useMutation(api.events.claimChecklistItem);
  const toggleItem = useMutation(api.events.toggleChecklistItem);

  const [newItem, setNewItem] = useState("");

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newItem.trim()) return;
    await addItem({ channelId, item: newItem.trim() });
    setNewItem("");
  }

  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-accent-event">
        Checklist
      </h3>

      {items && items.length > 0 && (
        <div className="mb-3 flex flex-col gap-1.5">
          {items.map((item) => {
            const assignee = item.assignedTo
              ? memberMap.get(item.assignedTo as string)
              : null;
            return (
              <div
                key={item._id}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-bg-surface"
              >
                <button
                  onClick={() => toggleItem({ itemId: item._id })}
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors",
                    item.isCompleted
                      ? "border-accent-hangout bg-accent-hangout/20 text-accent-hangout"
                      : "border-border hover:border-border-focus"
                  )}
                >
                  {item.isCompleted && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  )}
                </button>
                <span
                  className={cn(
                    "flex-1 text-sm",
                    item.isCompleted && "text-text-tertiary line-through"
                  )}
                >
                  {item.item}
                </span>
                {assignee ? (
                  <span className="text-xs text-text-tertiary">
                    {assignee.name}
                  </span>
                ) : (
                  <button
                    onClick={() => claimItem({ itemId: item._id })}
                    className="text-xs text-accent-event hover:underline"
                  >
                    Claim
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          placeholder="Add item..."
          className="flex-1 rounded-lg border border-border bg-bg-surface px-3 py-1.5 text-sm text-text-primary placeholder:text-text-tertiary focus:border-border-focus focus:outline-none"
        />
        <button
          type="submit"
          disabled={!newItem.trim()}
          className="rounded-lg bg-accent-event/20 px-3 py-1.5 text-sm font-medium text-accent-event transition-colors hover:bg-accent-event/30 disabled:opacity-40"
        >
          Add
        </button>
      </form>
    </div>
  );
}
