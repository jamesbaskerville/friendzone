import { query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser, assertGroupMember } from "./lib/permissions";

export const leaderboard = query({
  args: {
    groupId: v.id("groups"),
    game: v.string(),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    await assertGroupMember(ctx, args.groupId, user._id);

    return await ctx.db
      .query("gameScores")
      .withIndex("by_group_game_date", (q) =>
        q
          .eq("groupId", args.groupId)
          .eq("game", args.game)
          .eq("date", args.date)
      )
      .collect();
  },
});

export const stats = query({
  args: {
    groupId: v.id("groups"),
    userId: v.id("users"),
    game: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    await assertGroupMember(ctx, args.groupId, user._id);

    const scores = await ctx.db
      .query("gameScores")
      .withIndex("by_user_game", (q) =>
        q.eq("userId", args.userId).eq("game", args.game)
      )
      .order("desc")
      .collect();

    if (scores.length === 0) {
      return { totalGames: 0, averageScore: 0, bestScore: 0, currentStreak: 0 };
    }

    const totalGames = scores.length;
    const averageScore =
      scores.reduce((sum, s) => sum + s.score, 0) / totalGames;
    const bestScore =
      args.game === "mini"
        ? Math.min(...scores.map((s) => s.score))
        : Math.max(...scores.map((s) => s.score));

    // Calculate current streak (consecutive days)
    let currentStreak = 0;
    const sortedByDate = [...scores].sort(
      (a, b) => b.date.localeCompare(a.date)
    );

    const today = new Date().toISOString().split("T")[0]!;
    let expectedDate = today;

    for (const score of sortedByDate) {
      if (score.date === expectedDate) {
        currentStreak++;
        // Move to previous day
        const d = new Date(expectedDate);
        d.setDate(d.getDate() - 1);
        expectedDate = d.toISOString().split("T")[0]!;
      } else if (score.date < expectedDate) {
        break;
      }
    }

    return { totalGames, averageScore, bestScore, currentStreak };
  },
});
