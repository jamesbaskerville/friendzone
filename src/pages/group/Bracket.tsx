import { useParams } from "react-router";
import { useQuery } from "convex/react";
import { motion } from "framer-motion";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { NominationPhase } from "@/components/brackets/NominationPhase";
import { VotingBracket } from "@/components/brackets/VotingBracket";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export function Bracket() {
  const { bracketId } = useParams();
  const channelId = bracketId as Id<"channels">;

  const channel = useQuery(api.channels.getById, { channelId });

  if (!channel) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-3 border-b border-border bg-bg-secondary px-4 py-3">
        <span className="text-lg text-accent-bracket">{"\u{1F3C6}"}</span>
        <div>
          <h2 className="font-display text-lg font-semibold">
            {channel.name}
          </h2>
          <p className="text-xs capitalize text-accent-bracket">
            {channel.bracketStatus ?? "nominating"}
          </p>
        </div>
      </header>

      {channel.bracketStatus === "nominating" && (
        <NominationPhase channel={channel} />
      )}

      {channel.bracketStatus === "voting" && (
        <VotingBracket channel={channel} />
      )}

      {channel.bracketStatus === "complete" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", damping: 12 }}
            className="text-6xl"
          >
            {"\u{1F3C6}"}
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="font-display text-3xl font-bold text-accent-bracket"
          >
            {channel.bracketWinner}
          </motion.h2>
          {channel.bracketQuestion && (
            <p className="text-text-secondary">{channel.bracketQuestion}</p>
          )}
          <VotingBracket channel={channel} />
        </div>
      )}
    </div>
  );
}
