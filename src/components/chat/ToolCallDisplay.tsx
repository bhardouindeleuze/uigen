import { Loader2 } from "lucide-react";

interface ToolInvocation {
  toolCallId: string;
  toolName: string;
  args: Record<string, any>;
  state: string;
  result?: any;
}

interface ToolCallDisplayProps {
  toolInvocation: ToolInvocation;
}

function getFileName(path: string): string {
  if (!path) return "";
  const parts = path.split("/");
  return parts[parts.length - 1];
}

export function getToolCallMessage(
  toolName: string,
  args: Record<string, any>,
  isComplete: boolean
): string {
  const command = args?.command;
  const path = args?.path;
  const fileName = getFileName(path);

  if (toolName === "str_replace_editor") {
    switch (command) {
      case "create":
        return isComplete ? `Created ${fileName}` : `Creating ${fileName}`;
      case "str_replace":
        return isComplete ? `Edited ${fileName}` : `Editing ${fileName}`;
      case "insert":
        return isComplete ? `Edited ${fileName}` : `Editing ${fileName}`;
      case "view":
        return isComplete ? `Read ${fileName}` : `Reading ${fileName}`;
    }
  }

  if (toolName === "file_manager") {
    const newPath = args?.new_path;
    const newFileName = getFileName(newPath);

    switch (command) {
      case "rename":
        return isComplete
          ? `Renamed ${fileName} → ${newFileName}`
          : `Renaming ${fileName} → ${newFileName}`;
      case "delete":
        return isComplete ? `Deleted ${fileName}` : `Deleting ${fileName}`;
    }
  }

  return toolName;
}

export function ToolCallDisplay({ toolInvocation }: ToolCallDisplayProps) {
  const isComplete =
    toolInvocation.state === "result" && toolInvocation.result != null;
  const message = getToolCallMessage(
    toolInvocation.toolName,
    toolInvocation.args,
    isComplete
  );

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200">
      {isComplete ? (
        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
      ) : (
        <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
      )}
      <span className="text-neutral-700">{message}</span>
    </div>
  );
}
