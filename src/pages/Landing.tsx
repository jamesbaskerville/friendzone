import { useState, useEffect } from "react";
import {
  Authenticated,
  Unauthenticated,
  AuthLoading,
} from "convex/react";
import { useQuery, useMutation } from "convex/react";
import { useUser, useClerk } from "@clerk/clerk-react";
import { Link, useNavigate } from "react-router";
import { motion } from "framer-motion";
import { api } from "../../convex/_generated/api";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Modal } from "@/components/ui/Modal";

function UserSync({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const createOrUpdate = useMutation(api.users.createOrUpdate);
  const convexUser = useQuery(api.users.me);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (!user || syncing || convexUser) return;
    setSyncing(true);
    createOrUpdate({
      clerkId: user.id,
      name: user.fullName ?? user.firstName ?? "User",
      username:
        user.username ?? user.primaryEmailAddress?.emailAddress ?? user.id,
      avatarUrl: user.imageUrl,
    }).finally(() => setSyncing(false));
  }, [user, syncing, convexUser, createOrUpdate]);

  if (!convexUser) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return <>{children}</>;
}

function GroupList() {
  const groups = useQuery(api.groups.list);
  const navigate = useNavigate();
  const { signOut } = useClerk();
  const createGroup = useMutation(api.groups.create);
  const joinGroup = useMutation(api.groups.join);

  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!groupName.trim()) return;
    setLoading(true);
    setError("");
    try {
      const id = await createGroup({ name: groupName.trim() });
      setShowCreate(false);
      setGroupName("");
      navigate(`/g/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create group");
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteCode.trim()) return;
    setLoading(true);
    setError("");
    try {
      const id = await joinGroup({ inviteCode: inviteCode.trim() });
      setShowJoin(false);
      setInviteCode("");
      navigate(`/g/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid invite code");
    } finally {
      setLoading(false);
    }
  }

  if (groups === undefined) {
    return <LoadingSpinner className="mt-12" />;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <h1 className="font-display text-2xl font-bold">FriendZone</h1>
        <button
          onClick={() => signOut()}
          className="text-text-secondary hover:text-text-primary text-sm transition-colors"
        >
          Sign out
        </button>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-8">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold">Your Groups</h2>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setShowJoin(true);
                setError("");
              }}
              className="rounded-lg border border-border bg-bg-surface px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-bg-elevated"
            >
              Join
            </button>
            <button
              onClick={() => {
                setShowCreate(true);
                setError("");
              }}
              className="rounded-lg bg-accent-action px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-accent-action/80"
            >
              New Group
            </button>
          </div>
        </div>

        {groups.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="text-5xl">{"\u{1F44B}"}</div>
            <p className="text-text-secondary text-lg">
              No groups yet. Create one or join with an invite code.
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {groups.filter((g): g is NonNullable<typeof g> => g !== null).map((group, i) => (
              <motion.div
                key={group._id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  to={`/g/${group._id}`}
                  className="group flex items-center gap-4 rounded-xl border border-border bg-bg-secondary p-4 transition-colors hover:bg-bg-surface"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-hangout/20 text-xl">
                    {"\u{1F465}"}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-display text-lg font-semibold transition-colors group-hover:text-accent-hangout">
                      {group.name}
                    </h3>
                    <p className="text-text-tertiary text-sm">
                      Created{" "}
                      {new Date(group.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="text-text-tertiary transition-transform group-hover:translate-x-1">
                    {"\u2192"}
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Create a Group"
      >
        <form onSubmit={handleCreate}>
          <input
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Group name"
            autoFocus
            className="mb-4 w-full rounded-lg border border-border bg-bg-surface px-4 py-3 text-text-primary placeholder:text-text-tertiary focus:border-border-focus focus:outline-none"
          />
          {error && (
            <p className="mb-3 text-sm text-accent-action">{error}</p>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="rounded-lg px-4 py-2 text-sm text-text-secondary hover:text-text-primary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !groupName.trim()}
              className="rounded-lg bg-accent-action px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-accent-action/80 disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={showJoin}
        onClose={() => setShowJoin(false)}
        title="Join a Group"
      >
        <form onSubmit={handleJoin}>
          <input
            type="text"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            placeholder="Invite code"
            autoFocus
            className="mb-4 w-full rounded-lg border border-border bg-bg-surface px-4 py-3 text-text-primary placeholder:text-text-tertiary focus:border-border-focus focus:outline-none"
          />
          {error && (
            <p className="mb-3 text-sm text-accent-action">{error}</p>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowJoin(false)}
              className="rounded-lg px-4 py-2 text-sm text-text-secondary hover:text-text-primary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !inviteCode.trim()}
              className="rounded-lg bg-accent-action px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-accent-action/80 disabled:opacity-50"
            >
              {loading ? "Joining..." : "Join"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export function Landing() {
  return (
    <div className="min-h-screen">
      <AuthLoading>
        <div className="flex min-h-screen items-center justify-center">
          <LoadingSpinner />
        </div>
      </AuthLoading>

      <Unauthenticated>
        <div className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="font-display mb-3 text-6xl font-bold">
              FriendZone
            </h1>
            <p className="text-text-secondary text-lg">
              The chat app for friend groups.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex gap-4"
          >
            <Link
              to="/sign-in"
              className="bg-accent-action hover:bg-accent-action/80 rounded-lg px-6 py-3 font-semibold transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/sign-up"
              className="bg-bg-surface hover:bg-bg-elevated rounded-lg border border-border px-6 py-3 font-semibold transition-colors"
            >
              Sign Up
            </Link>
          </motion.div>
        </div>
      </Unauthenticated>

      <Authenticated>
        <UserSync>
          <GroupList />
        </UserSync>
      </Authenticated>
    </div>
  );
}
