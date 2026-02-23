import { useParams } from "react-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { useGroupContext } from "@/lib/UserContext";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export function Splits() {
  const { groupId: groupIdParam } = useParams();
  const groupId = groupIdParam as Id<"groups">;
  const { currentUser, memberMap } = useGroupContext();

  const balances = useQuery(api.splits.getBalances, { groupId });
  const markPaid = useMutation(api.splits.markPaid);

  if (balances === undefined) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const youOwe = balances.filter((b) => b.fromUserId === currentUser._id);
  const owedToYou = balances.filter((b) => b.toUserId === currentUser._id);

  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-border bg-bg-secondary px-4 py-3">
        <h2 className="font-display text-lg font-semibold">
          {"\u{1F4B0}"} Bill Splits
        </h2>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        {balances.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="text-4xl">{"\u{1F4B8}"}</div>
            <p className="text-text-secondary">
              No outstanding balances. All settled up!
            </p>
          </div>
        ) : (
          <div className="mx-auto max-w-md space-y-6">
            {youOwe.length > 0 && (
              <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-accent-action">
                  You Owe
                </h3>
                <div className="flex flex-col gap-2">
                  {youOwe.map((b) => {
                    const to = memberMap.get(b.toUserId as string);
                    return (
                      <div
                        key={b._id}
                        className="flex items-center justify-between rounded-lg border border-border bg-bg-surface px-4 py-3"
                      >
                        <div>
                          <p className="text-sm font-medium">
                            {to?.name ?? "Unknown"}
                          </p>
                          <p className="text-lg font-bold text-accent-action">
                            ${(b.amount / 100).toFixed(2)}
                          </p>
                        </div>
                        <button
                          onClick={() => markPaid({ balanceId: b._id })}
                          className="rounded-lg bg-accent-hangout/20 px-3 py-1.5 text-sm font-medium text-accent-hangout transition-colors hover:bg-accent-hangout/30"
                        >
                          Mark Paid
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {owedToYou.length > 0 && (
              <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-accent-hangout">
                  Owed to You
                </h3>
                <div className="flex flex-col gap-2">
                  {owedToYou.map((b) => {
                    const from = memberMap.get(b.fromUserId as string);
                    return (
                      <div
                        key={b._id}
                        className="flex items-center justify-between rounded-lg border border-border bg-bg-surface px-4 py-3"
                      >
                        <div>
                          <p className="text-sm font-medium">
                            {from?.name ?? "Unknown"}
                          </p>
                          <p className="text-lg font-bold text-accent-hangout">
                            ${(b.amount / 100).toFixed(2)}
                          </p>
                        </div>
                        <button
                          onClick={() => markPaid({ balanceId: b._id })}
                          className="rounded-lg border border-border px-3 py-1.5 text-sm text-text-secondary transition-colors hover:bg-bg-elevated"
                        >
                          Mark Paid
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
