import { test, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolCallDisplay, getToolCallMessage } from "../ToolCallDisplay";

afterEach(() => {
  cleanup();
});

// Unit tests for getToolCallMessage

test("str_replace_editor create shows friendly message", () => {
  expect(
    getToolCallMessage("str_replace_editor", { command: "create", path: "/components/Card.jsx" }, true)
  ).toBe("Created Card.jsx");

  expect(
    getToolCallMessage("str_replace_editor", { command: "create", path: "/components/Card.jsx" }, false)
  ).toBe("Creating Card.jsx");
});

test("str_replace_editor str_replace shows edit message", () => {
  expect(
    getToolCallMessage("str_replace_editor", { command: "str_replace", path: "/App.tsx" }, true)
  ).toBe("Edited App.tsx");

  expect(
    getToolCallMessage("str_replace_editor", { command: "str_replace", path: "/App.tsx" }, false)
  ).toBe("Editing App.tsx");
});

test("str_replace_editor insert shows edit message", () => {
  expect(
    getToolCallMessage("str_replace_editor", { command: "insert", path: "/utils/helpers.ts" }, true)
  ).toBe("Edited helpers.ts");
});

test("str_replace_editor view shows read message", () => {
  expect(
    getToolCallMessage("str_replace_editor", { command: "view", path: "/index.tsx" }, true)
  ).toBe("Read index.tsx");

  expect(
    getToolCallMessage("str_replace_editor", { command: "view", path: "/index.tsx" }, false)
  ).toBe("Reading index.tsx");
});

test("file_manager rename shows both paths", () => {
  expect(
    getToolCallMessage("file_manager", { command: "rename", path: "/old.jsx", new_path: "/new.jsx" }, true)
  ).toBe("Renamed old.jsx → new.jsx");

  expect(
    getToolCallMessage("file_manager", { command: "rename", path: "/old.jsx", new_path: "/new.jsx" }, false)
  ).toBe("Renaming old.jsx → new.jsx");
});

test("file_manager delete shows delete message", () => {
  expect(
    getToolCallMessage("file_manager", { command: "delete", path: "/components/OldComponent.tsx" }, true)
  ).toBe("Deleted OldComponent.tsx");

  expect(
    getToolCallMessage("file_manager", { command: "delete", path: "/components/OldComponent.tsx" }, false)
  ).toBe("Deleting OldComponent.tsx");
});

test("unknown tool falls back to tool name", () => {
  expect(
    getToolCallMessage("unknown_tool", {}, true)
  ).toBe("unknown_tool");
});

test("missing args handled gracefully", () => {
  expect(
    getToolCallMessage("str_replace_editor", {}, true)
  ).toBe("str_replace_editor");
});

// Component rendering tests

test("ToolCallDisplay renders completed state with green dot", () => {
  const { container } = render(
    <ToolCallDisplay
      toolInvocation={{
        toolCallId: "1",
        toolName: "str_replace_editor",
        args: { command: "create", path: "/components/Card.jsx" },
        state: "result",
        result: "File created",
      }}
    />
  );

  expect(screen.getByText("Created Card.jsx")).toBeDefined();
  expect(container.querySelector(".bg-emerald-500")).toBeDefined();
});

test("ToolCallDisplay renders in-progress state with spinner", () => {
  const { container } = render(
    <ToolCallDisplay
      toolInvocation={{
        toolCallId: "1",
        toolName: "str_replace_editor",
        args: { command: "create", path: "/components/Card.jsx" },
        state: "call",
      }}
    />
  );

  expect(screen.getByText("Creating Card.jsx")).toBeDefined();
  expect(container.querySelector(".animate-spin")).toBeDefined();
});
