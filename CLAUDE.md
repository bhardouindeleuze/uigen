# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run setup          # Install deps, generate Prisma client, run migrations
npm run dev            # Dev server with Turbopack (requires node-compat.cjs)
npm run build          # Production build
npm run lint           # ESLint
npm test               # Run all tests (vitest, jsdom environment)
npx vitest run src/lib/__tests__/file-system.test.ts  # Run a single test file
npm run db:reset       # Reset SQLite database
```

All `npm run dev/build/start` commands require `NODE_OPTIONS='--require ./node-compat.cjs'` (already configured in scripts).

## Architecture

UIGen is an AI-powered React component generator. Users describe components in a chat, Claude generates code via tool calls into a virtual file system, and a live preview renders the result in an iframe.

### Data Flow

1. **Chat** (`ChatProvider` → `/api/chat` route) sends messages + serialized virtual file system to the AI
2. **AI response** streams back text and tool calls (`str_replace_editor`, `file_manager`) via Vercel AI SDK's `streamText`
3. **Tool calls** modify a server-side `VirtualFileSystem` instance; the client-side `FileSystemContext` mirrors these changes via `onToolCall`
4. **Preview** (`PreviewFrame`) transforms all virtual files with Babel, creates blob URLs + an import map, and renders in a sandboxed iframe using `esm.sh` for third-party dependencies

### Key Abstractions

- **`VirtualFileSystem`** (`src/lib/file-system.ts`): In-memory file system with tree structure using `Map<string, FileNode>`. Supports serialize/deserialize for persistence. No disk I/O.
- **AI Tools** (`src/lib/tools/`): Two tools exposed to the LLM:
  - `str_replace_editor`: create, view, str_replace, insert operations on virtual files
  - `file_manager`: rename and delete operations
- **JSX Transformer** (`src/lib/transform/jsx-transformer.ts`): Client-side Babel transform that builds an import map from virtual files. Handles `@/` alias resolution, CSS extraction, and creates placeholder modules for missing imports.
- **Mock Provider** (`src/lib/provider.ts`): When no `ANTHROPIC_API_KEY` is set, a `MockLanguageModel` returns static component code (counter/form/card) to enable development without API access.

### Contexts

- `FileSystemProvider` wraps `ChatProvider` — chat depends on file system state
- `ChatProvider` uses `@ai-sdk/react`'s `useChat`, sending the serialized file system with every request

### Auth & Persistence

- JWT-based auth using `jose` library, stored in httpOnly cookies
- SQLite via Prisma — schema is in `prisma/schema.prisma` (always reference it for database structure)
- Projects store messages and file system data as JSON strings
- Anonymous users can use the app without persistence; authenticated users get project history

### Routes

- `/` — Anonymous landing or redirect to latest project for authenticated users
- `/[projectId]` — Project page (requires auth)
- `/api/chat` — Streaming chat endpoint

### UI Stack

- shadcn/ui (new-york style) with Tailwind CSS v4
- Monaco Editor for code editing
- `react-resizable-panels` for the split layout
- Preview iframe uses Tailwind CDN independently
