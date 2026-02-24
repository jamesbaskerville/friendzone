import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { useGroupContext } from "@/lib/UserContext";
import { ReactionPicker } from "./ReactionPicker";

interface Props {
  messageId: Id<"messages">;
}

export function ReactionBar({ messageId }: Props) {
  const { currentUser } = useGroupContext();
  const reactions = useQuery(api.reactions.getByMessage, { messageId });
  const addReaction = useMutation(api.reactions.add);
  const removeReaction = useMutation(api.reactions.remove);
  const [showPicker, setShowPicker] = useState(false);

  if (!reactions || reactions.length === 0) {
    return (
      <div className="relative mt-1 flex items-center">
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="rounded-full p-1 text-xs text-text-tertiary opacity-0 transition-opacity group-hover:opacity-100 hover:bg-bg-surface hover:text-text-secondary"
        >
          +
        </button>
        <AnimatePresence>
          {showPicker && (
            <ReactionPicker
              onSelect={(emoji) => {
                addReaction({ messageId, emoji });
                setShowPicker(false);
              }}
              onClose={() => setShowPicker(false)}
            />
          )}
        </AnimatePresence>
      </div>
    );
  }

  function handleToggle(emoji: string, userIds: string[]) {
    if (userIds.includes(currentUser._id as string)) {
      removeReaction({ messageId, emoji });
    } else {
      addReaction({ messageId, emoji });
    }
  }

  return (
    <div className="relative mt-1 flex flex-wrap items-center gap-1">
      {reactions.map((r) => {
        const hasReacted = r.userIds.includes(currentUser._id as string);
        return (
          <motion.button
            key={r.emoji}
            layout
            onClick={() => handleToggle(r.emoji, r.userIds)}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors",
              hasReacted
                ? "border-accent-action/40 bg-accent-action/10 text-text-primary"
                : "border-border bg-bg-surface text-text-secondary hover:border-border-focus"
            )}
          >
            <span>{r.emoji}</span>
            <span className="font-mono text-[10px]">{r.count}</span>
          </motion.button>
        );
      })}
      <button
        onClick={() => setShowPicker(!showPicker)}
        className="rounded-full border border-transparent px-1.5 py-0.5 text-xs text-text-tertiary transition-colors hover:border-border hover:bg-bg-surface hover:text-text-secondary"
      >
        +
      </button>
      <AnimatePresence>
        {showPicker && (
          <ReactionPicker
            onSelect={(emoji) => {
              addReaction({ messageId, emoji });
              setShowPicker(false);
            }}
            onClose={() => setShowPicker(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
