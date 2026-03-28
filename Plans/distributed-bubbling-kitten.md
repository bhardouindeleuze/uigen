# Plan: User-Friendly Tool Call Display

## Context

Currently, when the AI uses tools (e.g., creating or editing files), the chat shows raw tool names like `str_replace_editor` — meaningless to users. The tool invocation objects contain `args` with `command` and `path` fields that can be used to show friendly messages like "Created /components/Card.jsx" instead.

## Approach

### 1. Create `ToolCallDisplay` component

**New file:** `src/components/chat/ToolCallDisplay.tsx`

A component that takes a `ToolInvocation` and renders a human-readable description based on `toolName`, `args.command`, `args.path`, and `state`.

**Message mapping:**

| toolName | command | In-progress | Completed |
|---|---|---|---|
| `str_replace_editor` | `create` | Creating `path` | Created `path` |
| `str_replace_editor` | `str_replace` | Editing `path` | Edited `path` |
| `str_replace_editor` | `insert` | Editing `path` | Edited `path` |
| `str_replace_editor` | `view` | Reading `path` | Read `path` |
| `file_manager` | `rename` | Renaming `path` → `new_path` | Renamed `path` → `new_path` |
| `file_manager` | `delete` | Deleting `path` | Deleted `path` |
| Unknown | — | Fallback to `toolName` | Fallback to `toolName` |

The component keeps the existing visual style (pill with green dot or spinner) but replaces the raw tool name with the friendly message. The `path` is shown as just the filename portion for brevity (e.g., `Card.jsx` not `/components/Card.jsx`), with the full path available as context.

### 2. Update `MessageList.tsx`

Replace the inline `tool-invocation` case (lines 77-93) with `<ToolCallDisplay toolInvocation={tool} />`.

### 3. Create tests

**New file:** `src/components/chat/__tests__/ToolCallDisplay.test.tsx`

Test cases:
- `str_replace_editor` with `create` command shows "Created `path`"
- `str_replace_editor` with `str_replace` command shows "Edited `path`"
- `str_replace_editor` with `insert` command shows "Edited `path`"
- `str_replace_editor` with `view` command shows "Read `path`"
- `file_manager` with `rename` shows rename message with both paths
- `file_manager` with `delete` shows delete message
- In-progress state (not `result`) shows present participle ("Creating...")
- Unknown tool falls back to tool name
- Missing args handled gracefully

### 4. Update existing `MessageList` test

In `src/components/chat/__tests__/MessageList.test.tsx`, update the test on line 81 that asserts `screen.getByText("str_replace_editor")` to instead check for the friendly message (will need `args` with `command` and `path` in the test fixture).

## Files to modify

- **Create:** `src/components/chat/ToolCallDisplay.tsx`
- **Create:** `src/components/chat/__tests__/ToolCallDisplay.test.tsx`
- **Edit:** `src/components/chat/MessageList.tsx` (replace inline tool-invocation rendering)
- **Edit:** `src/components/chat/__tests__/MessageList.test.tsx` (update test assertion)

## Verification

1. Run `npx vitest run src/components/chat/__tests__/ToolCallDisplay.test.tsx` — all new tests pass
2. Run `npx vitest run src/components/chat/__tests__/MessageList.test.tsx` — existing tests still pass
3. Run `npm test` — full suite passes
4. Manually verify in browser: send a message, observe tool call pills show friendly text like "Created Card.jsx" instead of "str_replace_editor"
