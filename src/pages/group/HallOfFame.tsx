import { useParams } from "react-router";
import { useQuery } from "convex/react";
import { motion } from "framer-motion";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { timeAgo } from "@/lib/channelUtils";
import { useGroupContext } from "@/lib/UserContext";
import { Avatar } from "@/components/ui/Avatar";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export function HallOfFame() {
  const { groupId: groupIdParam } = useParams();
  const groupId = groupIdParam as Id<"groups">;
  const { group, memberMap } = useGroupContext();

  const entries = useQuery(api.hallOfFame.getByGroup, { groupId });

  if (entries === undefined) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-border bg-bg-secondary px-4 py-3">
        <h2 className="font-display text-lg font-semibold">
          {"\u{1F3C5}"} Hall of Fame
        </h2>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        {entries.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="text-4xl">{"\u{1F3C6}"}</div>
            <p className="text-text-secondary">
              No enshrined messages yet. React with {"\u{1F3C6}"} ({group.hallOfFameThreshold ?? 5}+ people) to enshrine!
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {entries.map((entry, i) => {
              const author = memberMap.get(entry.authorId as string);
              return (
                <motion.div
                  key={entry._id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-xl border border-trophy-gold/30 bg-bg-surface p-4"
                >
                  <div className="mb-3 flex items-center gap-2">
                    <Avatar
                      name={author?.name ?? "Unknown"}
                      url={author?.avatarUrl}
                      size="sm"
                    />
                    <span className="text-sm font-medium">
                      {author?.name ?? "Unknown"}
                    </span>
                    <span className="ml-auto flex items-center gap-1 text-sm text-trophy-gold">
                      {"\u{1F3C6}"} {entry.trophyCount}
                    </span>
                  </div>
                  <p className="mb-2 text-sm whitespace-pre-wrap">
                    {entry.body}
                  </p>
                  <p className="text-xs text-text-tertiary">
                    {timeAgo(entry.enshrineDate)}
                  </p>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
