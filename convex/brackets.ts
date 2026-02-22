import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser, assertGroupMember } from "./lib/permissions";

export const getEntries = query({
  args: { channelId: v.id("channels") },
  handler: async (ctx, args) => {
    const channel = await ctx.db.get(args.channelId);
    if (!channel) throw new Error("Channel not found");

    const user = await getCurrentUser(ctx);
    await assertGroupMember(ctx, channel.groupId, user._id);

    return await ctx.db
      .query("bracketEntries")
      .withIndex("by_channel", (q) => q.eq("channelId", args.channelId))
      .collect();
  },
});

export const getMatchups = query({
  args: { channelId: v.id("channels") },
  handler: async (ctx, args) => {
    const channel = await ctx.db.get(args.channelId);
    if (!channel) throw new Error("Channel not found");

    const user = await getCurrentUser(ctx);
    await assertGroupMember(ctx, channel.groupId, user._id);

    return await ctx.db
      .query("bracketMatchups")
      .withIndex("by_channel_round", (q) => q.eq("channelId", args.channelId))
      .collect();
  },
});

export const getVotes = query({
  args: { matchupId: v.id("bracketMatchups") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("bracketVotes")
      .withIndex("by_matchup", (q) => q.eq("matchupId", args.matchupId))
      .collect();
  },
});

export const addEntry = mutation({
  args: {
    channelId: v.id("channels"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    const channel = await ctx.db.get(args.channelId);
    if (!channel) throw new Error("Channel not found");
    if (channel.bracketStatus !== "nominating")
      throw new Error("Nominations are closed");

    await assertGroupMember(ctx, channel.groupId, user._id);

    return await ctx.db.insert("bracketEntries", {
      channelId: args.channelId,
      name: args.name,
      nominatedBy: user._id,
      createdAt: Date.now(),
    });
  },
});

export const lockAndGenerate = mutation({
  args: { channelId: v.id("channels") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    const channel = await ctx.db.get(args.channelId);
    if (!channel) throw new Error("Channel not found");
    if (channel.bracketStatus !== "nominating")
      throw new Error("Bracket is not in nominating phase");

    await assertGroupMember(ctx, channel.groupId, user._id);

    const entries = await ctx.db
      .query("bracketEntries")
      .withIndex("by_channel", (q) => q.eq("channelId", args.channelId))
      .collect();

    if (entries.length < 2)
      throw new Error("Need at least 2 entries for a bracket");

    // Shuffle for random seeding
    const shuffled = entries.sort(() => Math.random() - 0.5);

    // Pad to nearest power of 2 with byes
    const bracketSize = Math.pow(2, Math.ceil(Math.log2(shuffled.length)));
    const paddedEntries = [...shuffled.map((e) => e.name)];
    while (paddedEntries.length < bracketSize) {
      paddedEntries.push("BYE");
    }

    // Generate round 1 matchups
    for (let i = 0; i < paddedEntries.length; i += 2) {
      const entryA = paddedEntries[i]!;
      const entryB = paddedEntries[i + 1]!;
      const isBye = entryB === "BYE";

      await ctx.db.insert("bracketMatchups", {
        channelId: args.channelId,
        round: 1,
        position: i / 2,
        entryA,
        entryB,
        votesA: 0,
        votesB: 0,
        winner: isBye ? entryA : undefined,
        status: isBye ? "complete" : "active",
      });
    }

    await ctx.db.patch(args.channelId, { bracketStatus: "voting" });
  },
});

async function advanceMatchup(
  ctx: { db: any },
  matchupId: any
) {
  const matchup = await ctx.db.get(matchupId);
  if (!matchup) return;

  const winner = matchup.votesA >= matchup.votesB ? matchup.entryA : matchup.entryB;

  await ctx.db.patch(matchupId, {
    winner,
    status: "complete" as const,
  });

  // Check if all matchups in this round are complete
  const roundMatchups = await ctx.db
    .query("bracketMatchups")
    .withIndex("by_channel_round", (q: any) =>
      q.eq("channelId", matchup.channelId).eq("round", matchup.round)
    )
    .collect();

  const allComplete = roundMatchups.every((m: any) => m.status === "complete");
  if (!allComplete) return;

  const winners = roundMatchups.map((m: any) => m.winner!);

  // If only one winner, bracket is complete
  if (winners.length === 1) {
    const channel = await ctx.db.get(matchup.channelId);
    await ctx.db.patch(matchup.channelId, {
      bracketStatus: "complete" as const,
      bracketWinner: winners[0],
    });

    // Post result to parent channel if this is a fork
    if (channel?.parentChannelId) {
      await ctx.db.insert("messages", {
        channelId: channel.parentChannelId,
        authorId: channel.createdBy,
        body: `🏆 Bracket result: ${channel.bracketQuestion ?? "Bracket"} — Winner: ${winners[0]}`,
        createdAt: Date.now(),
        isDeleted: false,
        threadReplyCount: 0,
        messageType: "bracket_result" as const,
      });
    }
    return;
  }

  // Generate next round matchups
  const nextRound = matchup.round + 1;
  for (let i = 0; i < winners.length; i += 2) {
    await ctx.db.insert("bracketMatchups", {
      channelId: matchup.channelId,
      round: nextRound,
      position: i / 2,
      entryA: winners[i]!,
      entryB: winners[i + 1] ?? "BYE",
      votesA: 0,
      votesB: 0,
      winner: winners[i + 1] ? undefined : winners[i],
      status: winners[i + 1] ? ("active" as const) : ("complete" as const),
    });
  }
}

export const castVote = mutation({
  args: {
    matchupId: v.id("bracketMatchups"),
    vote: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    const matchup = await ctx.db.get(args.matchupId);
    if (!matchup) throw new Error("Matchup not found");
    if (matchup.status !== "active") throw new Error("Matchup is not active");

    // Check for existing vote
    const existingVote = await ctx.db
      .query("bracketVotes")
      .withIndex("by_matchup_user", (q) =>
        q.eq("matchupId", args.matchupId).eq("userId", user._id)
      )
      .first();

    if (existingVote) throw new Error("Already voted on this matchup");

    // Record vote
    await ctx.db.insert("bracketVotes", {
      matchupId: args.matchupId,
      userId: user._id,
      vote: args.vote,
      createdAt: Date.now(),
    });

    // Update vote count
    const field = args.vote === matchup.entryA ? "votesA" : "votesB";
    await ctx.db.patch(args.matchupId, {
      [field]: matchup[field] + 1,
    });

    // Check if all eligible members have voted
    const channel = await ctx.db.get(matchup.channelId);
    if (!channel) return;

    const members = await ctx.db
      .query("groupMembers")
      .withIndex("by_group", (q) => q.eq("groupId", channel.groupId))
      .collect();

    const votes = await ctx.db
      .query("bracketVotes")
      .withIndex("by_matchup", (q) => q.eq("matchupId", args.matchupId))
      .collect();

    // +1 because we just inserted but the query might not include it yet
    if (votes.length >= members.length) {
      await advanceMatchup(ctx, args.matchupId);
    }
  },
});
