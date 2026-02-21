# FriendZone — Chat App Plan

## Vision
A private chat app for friend groups — like Messenger/WhatsApp but self-hosted,
customizable, and with integrations that actually matter to your crew.

---

## 1. Core Features (v1)

### Messaging
- **1:1 and group chats** — create conversations, add/remove members
- **Text messages** with markdown support
- **Image & file sharing** — upload and preview media inline
- **Reactions** — emoji reactions on messages
- **Read receipts** — see who's seen your message
- **Typing indicators** — real-time "X is typing..."
- **Message history** — scroll-back with lazy loading
- **Push notifications** (web + mobile via service workers)

### User System
- **Auth** — email/password + OAuth (Google, GitHub, Apple)
- **Profiles** — display name, avatar, status message
- **Online/offline presence** — see who's around
- **Friend list** — add friends, manage contacts

### Groups
- **Named group chats** with avatars
- **Admin roles** — who can add/remove members, change settings
- **Pinned messages** — pin important info to a chat
- **Mention support** — @user and @everyone

---

## 2. Custom Integrations (the differentiator)

These are what make FriendZone more than "another chat app."

### Built-in Integrations
| Integration | Description |
|---|---|
| **Polls & Voting** | Create polls in any chat ("Where should we eat?") |
| **Bill Splitting** | Split expenses, track who owes what |
| **Event Planning** | Propose dates, RSVP, sync to calendars |
| **Shared Lists** | Groceries, movies to watch, trip packing lists |
| **Games** | Trivia, word games, mini-games in chat |

### External Service Hooks
| Service | What it does |
|---|---|
| **Spotify** | Share what you're listening to, collaborative playlists |
| **YouTube** | Preview links, watch-together queue |
| **Calendar** | Google/Apple calendar sync for events |
| **Location** | Opt-in live location sharing ("on my way") |
| **Weather** | Auto weather context for outdoor plans |

### Bot / AI Layer
- **Slash commands** — `/poll`, `/split`, `/event`, `/remind`
- **AI chat assistant** — summarize conversations, suggest plans, answer questions
- **Webhooks** — allow external services to post into chats
- **Custom bot API** — let users build their own bots

---

## 3. Proposed Tech Stack

### Frontend
- **Next.js 14+ (App Router)** — SSR, API routes, React Server Components
- **TypeScript** — throughout
- **Tailwind CSS** — styling
- **Socket.io client** — real-time messaging
- **PWA support** — installable on mobile via service worker

### Backend
- **Next.js API routes** — REST endpoints for CRUD operations
- **Socket.io server** — real-time message delivery, presence, typing indicators
- **Node.js** custom server (wrapping Next.js) for WebSocket support

### Database
- **PostgreSQL** — primary data store (users, chats, messages, integrations)
- **Prisma** — ORM for type-safe DB access and migrations
- **Redis** — caching, presence tracking, pub/sub for scaling WebSockets

### Auth
- **NextAuth.js (Auth.js)** — handles OAuth + credentials

### File Storage
- **S3-compatible storage** (AWS S3, Cloudflare R2, or MinIO for self-hosted)
- Presigned URLs for direct uploads from client

### Deployment
- **Docker Compose** for local dev and self-hosting
- **Vercel** (frontend) + **Railway/Fly.io** (WebSocket server + DB) for cloud

---

## 4. Data Model (key entities)

```
User
  id, email, name, avatar, status, createdAt

Conversation
  id, type (direct | group), name, avatar, createdAt

ConversationMember
  conversationId, userId, role (admin | member), joinedAt

Message
  id, conversationId, senderId, content, type (text | image | file | system | integration)
  replyToId (nullable), createdAt, editedAt

Reaction
  id, messageId, userId, emoji

ReadReceipt
  conversationId, userId, lastReadMessageId, readAt

Integration
  id, conversationId, type (poll | split | event | list | bot)
  config (jsonb), createdAt

IntegrationData
  id, integrationId, data (jsonb), createdAt
```

---

## 5. Architecture Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Monorepo vs separate | **Monorepo** | Simpler for a small team, shared types |
| REST vs GraphQL | **REST + WebSocket** | Simpler, WS handles real-time needs |
| Message storage | **PostgreSQL** | Good enough for friend-group scale, ACID compliance |
| Real-time | **Socket.io** | Broad compatibility, auto-reconnect, rooms |
| Auth | **NextAuth.js** | Built for Next.js, supports many providers |
| ORM | **Prisma** | Type safety, migrations, great DX |

---

## 6. Project Structure (proposed)

```
friendzone/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── app/                   # Next.js App Router pages
│   │   ├── (auth)/            # Login, register, forgot password
│   │   ├── (chat)/            # Main chat interface
│   │   │   ├── layout.tsx     # Sidebar + chat area layout
│   │   │   ├── [chatId]/      # Individual chat view
│   │   │   └── page.tsx       # Chat list / home
│   │   └── api/               # API routes
│   │       ├── auth/          # NextAuth endpoints
│   │       ├── chats/         # Chat CRUD
│   │       ├── messages/      # Message operations
│   │       ├── users/         # User management
│   │       └── integrations/  # Integration endpoints
│   ├── components/
│   │   ├── chat/              # ChatBubble, MessageInput, ChatList
│   │   ├── integrations/      # Poll, BillSplit, EventPlanner UIs
│   │   ├── layout/            # Sidebar, Header, Navigation
│   │   └── ui/                # Shared UI primitives
│   ├── lib/
│   │   ├── db.ts              # Prisma client
│   │   ├── socket.ts          # Socket.io setup
│   │   ├── auth.ts            # Auth config
│   │   └── storage.ts         # File upload helpers
│   ├── hooks/                 # React hooks (useChat, useSocket, etc.)
│   ├── types/                 # Shared TypeScript types
│   └── server/
│       └── socket-server.ts   # Custom Socket.io server
├── public/
├── docker-compose.yml
├── package.json
└── tsconfig.json
```

---

## 7. Implementation Phases

### Phase 1 — Foundation
- Project setup (Next.js, TypeScript, Tailwind, Prisma, PostgreSQL)
- Auth (sign up, log in, OAuth)
- User profiles
- Database schema + migrations

### Phase 2 — Core Chat
- 1:1 direct messaging
- Real-time delivery via WebSockets
- Message persistence
- Chat list sidebar
- Basic UI (conversation view, message input, message bubbles)

### Phase 3 — Group Chat + Polish
- Group conversations (create, add/remove members, admin roles)
- Reactions, replies, read receipts
- Typing indicators
- Image/file uploads
- Online presence

### Phase 4 — Integrations
- Integration framework (slash commands, embedded UI in chat)
- Polls & voting
- Bill splitting
- Event planning
- Shared lists

### Phase 5 — External + AI
- Spotify / YouTube link previews and embeds
- AI assistant in chat (conversation summaries, smart replies)
- Webhook API for external services
- Custom bot SDK

### Phase 6 — Production
- Push notifications
- PWA packaging
- Docker setup for self-hosting
- Performance optimization (message pagination, connection pooling)
- E2E encryption (stretch goal)

---

## 8. Open Questions

1. **Self-hosted vs cloud?** — Should this be easy to self-host (Docker), cloud-only (Vercel), or both?
2. **Mobile app?** — PWA first, or React Native from the start?
3. **E2E encryption?** — Important for privacy but adds complexity (key management, no server-side search)
4. **Scale target?** — Designing for <50 users vs 1000+ changes the architecture
5. **Monetization?** — Free/open-source, or any paid tier plans?
6. **Which integrations matter most?** — Should we prioritize polls, bill splitting, AI, or something else?
