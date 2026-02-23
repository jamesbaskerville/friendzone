import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { cn } from "@/lib/utils";
import { useGroupContext } from "@/lib/UserContext";
import { Avatar } from "@/components/ui/Avatar";

export function Settings() {
  const { group } = useGroupContext();
  const updateSenpai = useMutation(api.groups.updateSenpaiSettings);

  const updateHallOfFameThreshold = useMutation(
    api.groups.updateHallOfFameThreshold
  );
  const [hofThreshold, setHofThreshold] = useState(
    group.hallOfFameThreshold ?? 5
  );
  const [hofSaved, setHofSaved] = useState(false);

  async function handleSaveHofThreshold() {
    const value = Math.max(1, Math.round(hofThreshold));
    setHofThreshold(value);
    await updateHallOfFameThreshold({
      groupId: group._id,
      hallOfFameThreshold: value,
    });
    setHofSaved(true);
    setTimeout(() => setHofSaved(false), 2000);
  }

  const [senpaiEnabled, setSenpaiEnabled] = useState(
    group.senpaiEnabled ?? true
  );
  const [senpaiFrequency, setSenpaiFrequency] = useState<
    "quiet" | "normal" | "chatty"
  >(group.senpaiFrequency ?? "normal");
  const [senpaiPersonality, setSenpaiPersonality] = useState(
    group.senpaiPersonality ?? ""
  );
  const [saved, setSaved] = useState(false);

  async function handleSaveSenpai() {
    await updateSenpai({
      groupId: group._id,
      senpaiEnabled,
      senpaiFrequency,
      senpaiPersonality: senpaiPersonality || undefined,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const [copied, setCopied] = useState(false);
  function copyInvite() {
    if (group.inviteCode) {
      navigator.clipboard.writeText(group.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-border bg-bg-secondary px-4 py-3">
        <h2 className="font-display text-lg font-semibold">
          {"\u2699\uFE0F"} Settings
        </h2>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="mx-auto max-w-md space-y-8">
          {/* Group Info */}
          <section>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-text-secondary">
              Group
            </h3>
            <div className="rounded-xl border border-border bg-bg-surface p-4">
              <p className="font-display text-lg font-semibold">
                {group.name}
              </p>
              <p className="mt-1 text-sm text-text-tertiary">
                {group.members.length} members
              </p>
            </div>
          </section>

          {/* Invite Code */}
          <section>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-text-secondary">
              Invite Code
            </h3>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-lg border border-border bg-bg-surface px-4 py-3 font-mono text-sm">
                {group.inviteCode}
              </code>
              <button
                onClick={copyInvite}
                className="rounded-lg border border-border px-4 py-3 text-sm text-text-secondary transition-colors hover:bg-bg-surface hover:text-text-primary"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </section>

          {/* Members */}
          <section>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-text-secondary">
              Members
            </h3>
            <div className="flex flex-col gap-2">
              {group.members.map((member) => (
                <div
                  key={member._id}
                  className="flex items-center gap-3 rounded-lg border border-border bg-bg-surface px-4 py-3"
                >
                  <Avatar
                    name={member.user?.name ?? "Unknown"}
                    url={member.user?.avatarUrl}
                    size="sm"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {member.user?.name ?? "Unknown"}
                    </p>
                    {member.user?.username && (
                      <p className="text-xs text-text-tertiary">
                        @{member.user.username}
                      </p>
                    )}
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                      member.role === "owner"
                        ? "bg-trophy-gold/20 text-trophy-gold"
                        : member.role === "admin"
                          ? "bg-accent-bracket/20 text-accent-bracket"
                          : "bg-bg-elevated text-text-tertiary"
                    )}
                  >
                    {member.role}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Hall of Fame Settings */}
          <section>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-trophy-gold">
              Hall of Fame
            </h3>
            <div className="space-y-4 rounded-xl border border-trophy-gold/20 bg-trophy-gold/5 p-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Trophy Threshold
                </label>
                <p className="mb-2 text-xs text-text-tertiary">
                  Number of unique {"\u{1F3C6}"} reactions needed to enshrine a
                  message.
                </p>
                <input
                  type="number"
                  min={1}
                  value={hofThreshold}
                  onChange={(e) =>
                    setHofThreshold(parseInt(e.target.value, 10) || 1)
                  }
                  className="w-full rounded-lg border border-border bg-bg-surface px-4 py-2.5 text-sm text-text-primary focus:border-border-focus focus:outline-none"
                />
              </div>

              <button
                onClick={handleSaveHofThreshold}
                className="w-full rounded-lg bg-trophy-gold px-4 py-2.5 text-sm font-semibold text-bg-primary transition-colors hover:bg-trophy-gold/80"
              >
                {hofSaved ? "Saved!" : "Save Threshold"}
              </button>
            </div>
          </section>

          {/* Senpai Settings */}
          <section>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-accent-senpai">
              Senpai AI
            </h3>
            <div className="space-y-4 rounded-xl border border-accent-senpai/20 bg-accent-senpai/5 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Enabled</span>
                <button
                  onClick={() => setSenpaiEnabled(!senpaiEnabled)}
                  className={cn(
                    "relative h-6 w-11 rounded-full transition-colors",
                    senpaiEnabled ? "bg-accent-senpai" : "bg-bg-elevated"
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform",
                      senpaiEnabled ? "left-[22px]" : "left-0.5"
                    )}
                  />
                </button>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Frequency
                </label>
                <div className="flex gap-2">
                  {(["quiet", "normal", "chatty"] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setSenpaiFrequency(f)}
                      className={cn(
                        "flex-1 rounded-lg px-3 py-2 text-sm font-medium capitalize transition-colors",
                        senpaiFrequency === f
                          ? "bg-accent-senpai/20 text-accent-senpai"
                          : "bg-bg-surface text-text-tertiary hover:text-text-secondary"
                      )}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Personality
                </label>
                <input
                  type="text"
                  value={senpaiPersonality}
                  onChange={(e) => setSenpaiPersonality(e.target.value)}
                  placeholder="e.g., Sarcastic, encouraging, Gen Z..."
                  className="w-full rounded-lg border border-border bg-bg-surface px-4 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:border-border-focus focus:outline-none"
                />
              </div>

              <button
                onClick={handleSaveSenpai}
                className="w-full rounded-lg bg-accent-senpai px-4 py-2.5 text-sm font-semibold text-bg-primary transition-colors hover:bg-accent-senpai/80"
              >
                {saved ? "Saved!" : "Save Senpai Settings"}
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
