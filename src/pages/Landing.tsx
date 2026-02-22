import {
  Authenticated,
  Unauthenticated,
  AuthLoading,
} from "convex/react";
import { Link } from "react-router";

export function Landing() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <h1 className="font-display text-5xl font-bold">FriendZone</h1>
      <p className="text-text-secondary text-lg">
        The chat app for friend groups.
      </p>

      <AuthLoading>
        <p className="text-text-tertiary">Loading...</p>
      </AuthLoading>

      <Unauthenticated>
        <div className="flex gap-4">
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
        </div>
      </Unauthenticated>

      <Authenticated>
        <p className="text-text-secondary">
          You're signed in! Group list coming soon.
        </p>
      </Authenticated>
    </div>
  );
}
