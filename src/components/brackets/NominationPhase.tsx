import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { motion } from "framer-motion";
import { api } from "../../../convex/_generated/api";
import type { Doc } from "../../../convex/_generated/dataModel";
import { useGroupContext } from "@/lib/UserContext";

interface Props {
  channel: Doc<"channels">;
}

export function NominationPhase({ channel }: Props) {
  const { memberMap } = useGroupContext();
  const entries = useQuery(api.brackets.getEntries, {
    channelId: channel._id,
  });
  const addEntry = useMutation(api.brackets.addEntry);
  const lockAndGenerate = useMutation(api.brackets.lockAndGenerate);

  const [name, setName] = useState("");
  const [locking, setLocking] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    await addEntry({ channelId: channel._id, name: name.trim() });
    setName("");
  }

  async function handleLock() {
    setLocking(true);
    try {
      await lockAndGenerate({ channelId: channel._id });
    } finally {
      setLocking(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col p-6">
      {channel.bracketQuestion && (
        <h2 className="font-display mb-6 text-center text-2xl font-bold text-accent-bracket">
          {channel.bracketQuestion}
        </h2>
      )}

      <div className="mx-auto w-full max-w-md">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-text-secondary">
          Nominations ({entries?.length ?? 0})
        </h3>

        <div className="mb-4 flex flex-col gap-2">
          {entries?.map((entry, i) => {
            const nominator = memberMap.get(entry.nominatedBy as string);
            return (
              <motion.div
                key={entry._id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center justify-between rounded-lg border border-border bg-bg-surface px-4 py-3"
              >
                <span className="font-medium">{entry.name}</span>
                <span className="text-xs text-text-tertiary">
                  by {nominator?.name ?? "Unknown"}
                </span>
              </motion.div>
            );
          })}
        </div>

        <form onSubmit={handleAdd} className="mb-6 flex gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Add a nomination..."
            className="flex-1 rounded-lg border border-border bg-bg-surface px-4 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:border-border-focus focus:outline-none"
          />
          <button
            type="submit"
            disabled={!name.trim()}
            className="rounded-lg bg-accent-bracket/20 px-4 py-2.5 text-sm font-medium text-accent-bracket transition-colors hover:bg-accent-bracket/30 disabled:opacity-40"
          >
            Add
          </button>
        </form>

        <button
          onClick={handleLock}
          disabled={locking || (entries?.length ?? 0) < 2}
          className="w-full rounded-lg bg-accent-bracket px-4 py-3 text-sm font-semibold text-bg-primary transition-colors hover:bg-accent-bracket/80 disabled:opacity-40"
        >
          {locking
            ? "Starting..."
            : `Lock & Start Bracket${(entries?.length ?? 0) < 2 ? " (need 2+)" : ""}`}
        </button>
      </div>
    </div>
  );
}
