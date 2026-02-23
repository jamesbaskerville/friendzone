import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Doc } from "../../../convex/_generated/dataModel";
import { MatchupCard } from "./MatchupCard";

interface Props {
  channel: Doc<"channels">;
}

export function VotingBracket({ channel }: Props) {
  const matchups = useQuery(api.brackets.getMatchups, {
    channelId: channel._id,
  });

  if (!matchups) return null;

  // Group by round
  const rounds = new Map<number, typeof matchups>();
  for (const m of matchups) {
    const round = rounds.get(m.round) ?? [];
    round.push(m);
    rounds.set(m.round, round);
  }

  const sortedRounds = Array.from(rounds.entries()).sort(
    ([a], [b]) => a - b
  );

  return (
    <div className="flex flex-1 gap-6 overflow-x-auto p-6">
      {sortedRounds.map(([round, roundMatchups]) => (
        <div key={round} className="flex shrink-0 flex-col gap-4">
          <h3 className="text-center text-xs font-semibold uppercase tracking-wider text-text-tertiary">
            {sortedRounds.length === 1
              ? "Final"
              : round === sortedRounds.length
                ? "Final"
                : `Round ${round}`}
          </h3>
          <div className="flex flex-col justify-around gap-4" style={{ minWidth: 200 }}>
            {roundMatchups
              .sort((a, b) => a.position - b.position)
              .map((matchup) => (
                <MatchupCard key={matchup._id} matchup={matchup} />
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
