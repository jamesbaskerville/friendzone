import { query } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { getCurrentUser, assertGroupMember } from "./lib/permissions";

export const getTimeline = query({
  args: {
    groupId: v.id("groups"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    await assertGroupMember(ctx, args.groupId, user._id);

    // Get all channels for this group
    const channels = await ctx.db
      .query("channels")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .collect();

    const channelIds = new Set(channels.map((c) => c._id));

    // Query messages with media across all channels
    // Since we can't paginate across multiple indexes, we query all messages
    // and filter for media. For a production app, a dedicated media table would be better.
    const allMediaMessages = [];
    for (const channel of channels) {
      const messages = await ctx.db
        .query("messages")
        .withIndex("by_channel", (q) => q.eq("channelId", channel._id))
        .order("desc")
        .collect();

      const mediaMessages = messages.filter(
        (m) =>
          m.mediaStorageIds &&
          m.mediaStorageIds.length > 0 &&
          !m.isDeleted
      );

      allMediaMessages.push(...mediaMessages);
    }

    // Sort by createdAt descending
    allMediaMessages.sort((a, b) => b.createdAt - a.createdAt);

    // Manual pagination
    const cursor = args.paginationOpts.cursor;
    const numItems = args.paginationOpts.numItems;

    let startIdx = 0;
    if (cursor) {
      startIdx = allMediaMessages.findIndex(
        (m) => m._id === cursor
      );
      if (startIdx === -1) startIdx = 0;
      else startIdx += 1;
    }

    const page = allMediaMessages.slice(startIdx, startIdx + numItems);
    const isDone = startIdx + numItems >= allMediaMessages.length;

    return {
      page,
      isDone,
      continueCursor: isDone ? null : page[page.length - 1]?._id ?? null,
    };
  },
});
