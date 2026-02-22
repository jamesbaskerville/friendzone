import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser, assertGroupMember } from "./lib/permissions";

export const getNowPlaying = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    await assertGroupMember(ctx, args.groupId, user._id);

    return await ctx.db
      .query("nowPlaying")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .order("desc")
      .collect();
  },
});

export const updateNowPlaying = mutation({
  args: {
    groupId: v.id("groups"),
    trackName: v.string(),
    artistName: v.string(),
    albumArtUrl: v.optional(v.string()),
    spotifyUri: v.string(),
    isPlaying: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    await assertGroupMember(ctx, args.groupId, user._id);

    const existing = await ctx.db
      .query("nowPlaying")
      .withIndex("by_user_group", (q) =>
        q.eq("userId", user._id).eq("groupId", args.groupId)
      )
      .first();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        trackName: args.trackName,
        artistName: args.artistName,
        albumArtUrl: args.albumArtUrl,
        spotifyUri: args.spotifyUri,
        isPlaying: args.isPlaying,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("nowPlaying", {
        userId: user._id,
        groupId: args.groupId,
        trackName: args.trackName,
        artistName: args.artistName,
        albumArtUrl: args.albumArtUrl,
        spotifyUri: args.spotifyUri,
        isPlaying: args.isPlaying,
        updatedAt: now,
      });
    }
  },
});
