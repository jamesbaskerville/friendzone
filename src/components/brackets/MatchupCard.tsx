import { useMutation, useQuery } from "convex/react";
import { motion } from "framer-motion";
import { api } from "../../../convex/_generated/api";
import type { Doc } from "../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { useGroupContext } from "@/lib/UserContext";

interface Props {
  matchup: Doc<"bracketMatchups">;
}

export function MatchupCard({ matchup }: Props) {
  const { currentUser } = useGroupContext();
  const castVote = useMutation(api.brackets.castVote);
  const votes = useQuery(api.brackets.getVotes, {
    matchupId: matchup._id,
  });

  const myVote = votes?.find((v) => v.userId === currentUser._id);
  const isActive = matchup.status === "active";
  const isComplete = matchup.status === "complete";

  function handleVote(vote: string) {
    if (!isActive || myVote) return;
    castVote({ matchupId: matchup._id, vote });
  }

  return (
    <motion.div
      layout
      className={cn(
        "rounded-xl border p-3",
        isActive
          ? "border-accent-bracket/50 bg-bg-surface shadow-[0_0_12px_rgba(196,154,224,0.15)]"
          : "border-border bg-bg-secondary"
      )}
    >
      {[matchup.entryA, matchup.entryB].map((entry) => {
        if (entry === "BYE") return null;
        const isWinner = isComplete && matchup.winner === entry;
        const isMyVote = myVote?.vote === entry;
        const voteCount =
          entry === matchup.entryA ? matchup.votesA : matchup.votesB;

        return (
          <button
            key={entry}
            onClick={() => handleVote(entry)}
            disabled={!isActive || !!myVote}
            className={cn(
              "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors",
              isWinner && "bg-accent-bracket/20 text-accent-bracket font-semibold",
              isMyVote && !isWinner && "bg-accent-bracket/10",
              isActive && !myVote && "hover:bg-bg-elevated cursor-pointer",
              !isActive && !isWinner && "text-text-secondary"
            )}
          >
            <span className="flex items-center gap-2">
              {isWinner && "\u{1F451}"}
              {entry}
            </span>
            {(isComplete || myVote) && (
              <span className="font-mono text-xs text-text-tertiary">
                {voteCount}
              </span>
            )}
          </button>
        );
      })}
    </motion.div>
  );
}
