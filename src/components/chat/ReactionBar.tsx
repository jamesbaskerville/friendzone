import { useQuery, useMutation } from "convex/react";
import { motion } from "framer-motion";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { useGroupContext } from "@/lib/UserContext";

interface Props {
  messageId: Id<"messages">;
  isOwn: boolean;
}

export function ReactionBar({ messageId, isOwn }: Props) {
  const { currentUser } = useGroupContext();
  const reactions = useQuery(api.reactions.getByMessage, { messageId });
  const addReaction = useMutation(api.reactions.add);
  const removeReaction = useMutation(api.reactions.remove);

  if (!reactions || reactions.length === 0) {
    return null;
  }

  function handleToggle(emoji: string, userIds: string[]) {
    if (userIds.includes(currentUser._id as string)) {
      removeReaction({ messageId, emoji });
    } else {
      addReaction({ messageId, emoji });
    }
  }

  return (
    <div
      className={cn(
        "absolute -bottom-2.5 z-10 flex items-center gap-0.5",
        isOwn ? "right-1" : "left-1"
      )}
    >
      <div className="flex items-center gap-0.5 rounded-full border border-border bg-bg-secondary px-1 py-0.5 shadow-sm">
        {reactions.map((r) => {
          const hasReacted = r.userIds.includes(currentUser._id as string);
          return (
            <motion.button
              key={r.emoji}
              layout
              onClick={() => handleToggle(r.emoji, r.userIds)}
              className={cn(
                "inline-flex items-center gap-0.5 rounded-full px-1 py-0 text-xs transition-colors",
                hasReacted
                  ? "bg-accent-action/15 text-text-primary"
                  : "text-text-secondary hover:bg-bg-surface"
              )}
            >
              <span className="text-[11px]">{r.emoji}</span>
              {r.count > 1 && (
                <span className="font-mono text-[9px]">{r.count}</span>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
