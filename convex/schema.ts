import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ─── USERS ───────────────────────────────────────────────
  users: defineTable({
    clerkId: v.string(),
    name: v.string(),
    username: v.string(),
    avatarUrl: v.optional(v.string()),
    avatarStorageId: v.optional(v.id("_storage")),
    spotifyRefreshToken: v.optional(v.string()),
    spotifyDisplayName: v.optional(v.string()),
    pushToken: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_clerkId", ["clerkId"])
    .index("by_username", ["username"]),

  // ─── GROUPS ──────────────────────────────────────────────
  groups: defineTable({
    name: v.string(),
    avatarStorageId: v.optional(v.id("_storage")),
    createdBy: v.id("users"),
    createdAt: v.number(),
    senpaiEnabled: v.boolean(),
    senpaiFrequency: v.union(
      v.literal("quiet"),
      v.literal("normal"),
      v.literal("chatty")
    ),
    senpaiPersonality: v.optional(v.string()),
    inviteCode: v.string(),
  }).index("by_inviteCode", ["inviteCode"]),

  groupMembers: defineTable({
    groupId: v.id("groups"),
    userId: v.id("users"),
    role: v.union(
      v.literal("owner"),
      v.literal("admin"),
      v.literal("member")
    ),
    joinedAt: v.number(),
    nickname: v.optional(v.string()),
    lastActiveAt: v.number(),
  })
    .index("by_group", ["groupId"])
    .index("by_user", ["userId"])
    .index("by_group_user", ["groupId", "userId"]),

  // ─── CHANNELS ────────────────────────────────────────────
  channels: defineTable({
    groupId: v.id("groups"),
    name: v.string(),
    type: v.union(
      v.literal("hangout"),
      v.literal("event"),
      v.literal("bracket")
    ),
    createdBy: v.id("users"),
    createdAt: v.number(),

    // Fork relationships
    parentChannelId: v.optional(v.id("channels")),
    parentMessageId: v.optional(v.id("messages")),
    forkDepth: v.number(),

    // State
    isArchived: v.boolean(),
    archivedAt: v.optional(v.number()),

    // Event-specific fields
    eventDate: v.optional(v.number()),
    eventEndDate: v.optional(v.number()),
    eventLocation: v.optional(v.string()),

    // Bracket-specific fields
    bracketQuestion: v.optional(v.string()),
    bracketStatus: v.optional(
      v.union(
        v.literal("nominating"),
        v.literal("voting"),
        v.literal("complete")
      )
    ),
    bracketWinner: v.optional(v.string()),

    // Spotify integration
    spotifyPlaylistId: v.optional(v.string()),
  })
    .index("by_group", ["groupId"])
    .index("by_group_type", ["groupId", "type"])
    .index("by_parent", ["parentChannelId"])
    .index("by_group_archived", ["groupId", "isArchived"]),

  // ─── MESSAGES ────────────────────────────────────────────
  messages: defineTable({
    channelId: v.id("channels"),
    authorId: v.id("users"),
    body: v.string(),
    createdAt: v.number(),
    editedAt: v.optional(v.number()),
    isDeleted: v.boolean(),

    // Thread support
    threadParentId: v.optional(v.id("messages")),
    threadReplyCount: v.number(),
    threadLastReplyAt: v.optional(v.number()),

    // Fork tracking
    forkedToChannelId: v.optional(v.id("channels")),

    // Media
    mediaStorageIds: v.optional(v.array(v.id("_storage"))),
    mediaTypes: v.optional(v.array(v.string())),

    // Link previews
    linkUrl: v.optional(v.string()),
    linkTitle: v.optional(v.string()),
    linkImage: v.optional(v.string()),

    // Special message types
    messageType: v.union(
      v.literal("text"),
      v.literal("system"),
      v.literal("senpai"),
      v.literal("bracket_result"),
      v.literal("game_score"),
      v.literal("split_request")
    ),

    // Game score metadata
    gameData: v.optional(
      v.object({
        game: v.string(),
        score: v.number(),
        attempts: v.optional(v.number()),
        date: v.string(),
        rawText: v.string(),
      })
    ),

    // Senpai metadata
    senpaiTrigger: v.optional(v.string()),
  })
    .index("by_channel", ["channelId", "createdAt"])
    .index("by_channel_toplevel", [
      "channelId",
      "threadParentId",
      "createdAt",
    ])
    .index("by_thread", ["threadParentId", "createdAt"])
    .index("by_author", ["authorId", "createdAt"])
    .searchIndex("search_body", {
      searchField: "body",
      filterFields: ["channelId"],
    }),

  // ─── REACTIONS ───────────────────────────────────────────
  reactions: defineTable({
    messageId: v.id("messages"),
    userId: v.id("users"),
    emoji: v.string(),
    createdAt: v.number(),
  })
    .index("by_message", ["messageId"])
    .index("by_message_emoji", ["messageId", "emoji"])
    .index("by_message_user", ["messageId", "userId"]),

  // ─── PINS ────────────────────────────────────────────────
  pins: defineTable({
    channelId: v.id("channels"),
    messageId: v.id("messages"),
    pinnedBy: v.id("users"),
    pinnedAt: v.number(),
  }).index("by_channel", ["channelId", "pinnedAt"]),

  // ─── HALL OF FAME ────────────────────────────────────────
  hallOfFame: defineTable({
    groupId: v.id("groups"),
    messageId: v.id("messages"),
    channelId: v.id("channels"),
    authorId: v.id("users"),
    body: v.string(),
    trophyCount: v.number(),
    enshrineDate: v.number(),
  }).index("by_group", ["groupId", "enshrineDate"]),

  // ─── BRACKETS ────────────────────────────────────────────
  bracketEntries: defineTable({
    channelId: v.id("channels"),
    name: v.string(),
    nominatedBy: v.id("users"),
    seed: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_channel", ["channelId"]),

  bracketMatchups: defineTable({
    channelId: v.id("channels"),
    round: v.number(),
    position: v.number(),
    entryA: v.string(),
    entryB: v.string(),
    votesA: v.number(),
    votesB: v.number(),
    winner: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("active"),
      v.literal("complete")
    ),
    votingDeadline: v.optional(v.number()),
  }).index("by_channel_round", ["channelId", "round"]),

  bracketVotes: defineTable({
    matchupId: v.id("bracketMatchups"),
    userId: v.id("users"),
    vote: v.string(),
    createdAt: v.number(),
  })
    .index("by_matchup", ["matchupId"])
    .index("by_matchup_user", ["matchupId", "userId"]),

  // ─── EVENTS ──────────────────────────────────────────────
  eventRsvps: defineTable({
    channelId: v.id("channels"),
    userId: v.id("users"),
    status: v.union(
      v.literal("going"),
      v.literal("maybe"),
      v.literal("not_going")
    ),
    updatedAt: v.number(),
  })
    .index("by_channel", ["channelId"])
    .index("by_channel_user", ["channelId", "userId"]),

  eventChecklist: defineTable({
    channelId: v.id("channels"),
    item: v.string(),
    assignedTo: v.optional(v.id("users")),
    isCompleted: v.boolean(),
    createdBy: v.id("users"),
    createdAt: v.number(),
  }).index("by_channel", ["channelId"]),

  // ─── BILL SPLITS ─────────────────────────────────────────
  splits: defineTable({
    channelId: v.id("channels"),
    groupId: v.id("groups"),
    name: v.string(),
    totalAmount: v.number(),
    taxAmount: v.optional(v.number()),
    tipAmount: v.optional(v.number()),
    receiptStorageId: v.optional(v.id("_storage")),
    createdBy: v.id("users"),
    createdAt: v.number(),
    status: v.union(
      v.literal("claiming"),
      v.literal("calculated"),
      v.literal("settled")
    ),
  })
    .index("by_channel", ["channelId"])
    .index("by_group", ["groupId"]),

  splitItems: defineTable({
    splitId: v.id("splits"),
    name: v.string(),
    price: v.number(),
    quantity: v.number(),
    claimedBy: v.optional(v.array(v.id("users"))),
  }).index("by_split", ["splitId"]),

  splitBalances: defineTable({
    splitId: v.id("splits"),
    groupId: v.id("groups"),
    fromUserId: v.id("users"),
    toUserId: v.id("users"),
    amount: v.number(),
    isPaid: v.boolean(),
    paidAt: v.optional(v.number()),
  })
    .index("by_split", ["splitId"])
    .index("by_group_unpaid", ["groupId", "isPaid"])
    .index("by_from_user", ["fromUserId", "isPaid"]),

  // ─── SPOTIFY ─────────────────────────────────────────────
  nowPlaying: defineTable({
    userId: v.id("users"),
    groupId: v.id("groups"),
    trackName: v.string(),
    artistName: v.string(),
    albumArtUrl: v.optional(v.string()),
    spotifyUri: v.string(),
    isPlaying: v.boolean(),
    updatedAt: v.number(),
  })
    .index("by_group", ["groupId", "updatedAt"])
    .index("by_user_group", ["userId", "groupId"]),

  // ─── DAILY GAMES ─────────────────────────────────────────
  gameScores: defineTable({
    groupId: v.id("groups"),
    userId: v.id("users"),
    game: v.string(),
    date: v.string(),
    score: v.number(),
    attempts: v.optional(v.number()),
    messageId: v.id("messages"),
    createdAt: v.number(),
  })
    .index("by_group_game_date", ["groupId", "game", "date"])
    .index("by_user_game", ["userId", "game", "createdAt"]),

  // ─── PRESENCE ────────────────────────────────────────────
  presence: defineTable({
    userId: v.id("users"),
    groupId: v.id("groups"),
    channelId: v.optional(v.id("channels")),
    status: v.union(
      v.literal("online"),
      v.literal("idle"),
      v.literal("offline")
    ),
    lastSeenAt: v.number(),
  })
    .index("by_group", ["groupId"])
    .index("by_user_group", ["userId", "groupId"]),

  // ─── SENPAI ──────────────────────────────────────────────
  senpaiMemory: defineTable({
    groupId: v.id("groups"),
    memoryType: v.union(
      v.literal("inside_joke"),
      v.literal("running_bit"),
      v.literal("preference"),
      v.literal("milestone")
    ),
    content: v.string(),
    sourceMessageIds: v.optional(v.array(v.id("messages"))),
    createdAt: v.number(),
    relevanceScore: v.number(),
  }).index("by_group", ["groupId", "relevanceScore"]),

  // ─── NOTIFICATIONS ───────────────────────────────────────
  notifications: defineTable({
    userId: v.id("users"),
    groupId: v.id("groups"),
    channelId: v.optional(v.id("channels")),
    type: v.union(
      v.literal("message"),
      v.literal("mention"),
      v.literal("reaction"),
      v.literal("event_rsvp"),
      v.literal("bracket_vote"),
      v.literal("split_request"),
      v.literal("hall_of_fame"),
      v.literal("senpai")
    ),
    title: v.string(),
    body: v.string(),
    isRead: v.boolean(),
    createdAt: v.number(),
  }).index("by_user_unread", ["userId", "isRead", "createdAt"]),
});
