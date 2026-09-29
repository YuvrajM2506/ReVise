"use client";

import { useState, useMemo } from "react";
import {
  Folder,
  FolderOpen,
  FileCode,
  FileText,
  Search,
  ChevronRight,
  ChevronDown,
  GitPullRequest,
} from "lucide-react";

export interface FileTreeNode {
  id: string;
  name: string;
  path: string;
  type: "file" | "folder";
  children?: FileTreeNode[];
  issuesCount?: number;
}

export interface FileTreeProps {
  files: string[];
  activeFile: string;
  onSelectFile: (file: string) => void;
  fileIssuesMap?: Record<string, number>;
}

function getFileIcon(name: string) {
  if (
    name.endsWith(".ts") ||
    name.endsWith(".tsx") ||
    name.endsWith(".js") ||
    name.endsWith(".jsx")
  ) {
    return <FileCode size={13} style={{ color: "#02a0a0", flexShrink: 0 }} />;
  }
  if (name.endsWith(".py")) {
    return <FileCode size={13} style={{ color: "#ffbd65", flexShrink: 0 }} />;
  }
  if (name.endsWith(".diff") || name.endsWith(".patch")) {
    return <GitPullRequest size={13} style={{ color: "#a8c7d8", flexShrink: 0 }} />;
  }
  if (name.endsWith(".json") || name.endsWith(".md")) {
    return <FileText size={13} style={{ color: "#8ca0a8", flexShrink: 0 }} />;
  }
  return <FileCode size={13} style={{ color: "#8ca0a8", flexShrink: 0 }} />;
}

function buildFileTree(
  paths: string[],
  issuesMap: Record<string, number> = {}
): FileTreeNode[] {
  const root: FileTreeNode[] = [];

  paths.forEach((filePath) => {
    const parts = filePath.split("/");
    let currentLevel = root;

    parts.forEach((part, index) => {
      const isFile = index === parts.length - 1;
      const currentPath = parts.slice(0, index + 1).join("/");
      let existing = currentLevel.find((item) => item.name === part);

      if (!existing) {
        existing = {
          id: currentPath,
          name: part,
          path: currentPath,
          type: isFile ? "file" : "folder",
          children: isFile ? undefined : [],
          issuesCount: isFile
            ? issuesMap[currentPath] || issuesMap[part] || 0
            : 0,
        };
        currentLevel.push(existing);
      }

      if (!isFile && existing.children) {
        currentLevel = existing.children;
      }
    });
  });

  return root;
}

export function FileTree({
  files,
  activeFile,
  onSelectFile,
  fileIssuesMap = {},
}: FileTreeProps) {
  const [filter, setFilter] = useState("");
  const [expandedFolders, setExpandedFolders] = useState<
    Record<string, boolean>
  >({
    src: true,
    "src/auth": true,
    "src/api": true,
    "src/memory": true,
  });

  const toggleFolder = (folderPath: string) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [folderPath]: !prev[folderPath],
    }));
  };

  const filteredFiles = useMemo(() => {
    if (!filter.trim()) return files;
    const q = filter.toLowerCase();
    return files.filter((f) => f.toLowerCase().includes(q));
  }, [files, filter]);

  const tree = useMemo(() => {
    return buildFileTree(filteredFiles, fileIssuesMap);
  }, [filteredFiles, fileIssuesMap]);

  const renderNodes = (nodes: FileTreeNode[], depth = 0) => {
    return nodes.map((node) => {
      if (node.type === "folder") {
        const isExpanded = expandedFolders[node.path] ?? true;

        return (
          <div key={node.id} className="select-none">
            <button
              type="button"
              onClick={() => toggleFolder(node.path)}
              style={{ paddingLeft: `${depth * 12 + 8}px` }}
              className="flex w-full items-center gap-1.5 rounded py-1 text-left font-mono text-xs transition-colors duration-150 hover:bg-[rgba(2,160,160,0.08)]"
            >
              {isExpanded ? (
                <ChevronDown size={11} style={{ color: "#63777d", flexShrink: 0 }} />
              ) : (
                <ChevronRight size={11} style={{ color: "#63777d", flexShrink: 0 }} />
              )}
              {isExpanded ? (
                <FolderOpen size={13} style={{ color: "rgba(2,160,160,0.7)", flexShrink: 0 }} />
              ) : (
                <Folder size={13} style={{ color: "rgba(2,160,160,0.7)", flexShrink: 0 }} />
              )}
              <span className="truncate font-medium" style={{ color: "#c1cdcf" }}>
                {node.name}
              </span>
            </button>

            {isExpanded && node.children && (
              <div className="space-y-0.5">
                {renderNodes(node.children, depth + 1)}
              </div>
            )}
          </div>
        );
      }

      const isActive =
        activeFile === node.path ||
        activeFile.endsWith(node.name) ||
        node.path.endsWith(activeFile);

      return (
        <button
          key={node.id}
          type="button"
          onClick={() => onSelectFile(node.path)}
          style={{
            paddingLeft: `${depth * 12 + 18}px`,
            paddingRight: "10px",
            borderLeft: isActive
              ? "2px solid #02a0a0"
              : "2px solid transparent",
            background: isActive ? "rgba(2,160,160,0.1)" : "transparent",
          }}
          className="flex w-full items-center justify-between py-1.5 text-left font-mono text-xs transition-all duration-150"
          onMouseEnter={(e) => {
            if (!isActive) {
              (e.currentTarget as HTMLButtonElement).style.background =
                "rgba(17,40,48,0.6)";
            }
          }}
          onMouseLeave={(e) => {
            if (!isActive) {
              (e.currentTarget as HTMLButtonElement).style.background =
                "transparent";
            }
          }}
        >
          <div className="flex min-w-0 items-center gap-2">
            {getFileIcon(node.name)}
            <span
              className="truncate"
              style={{
                color: isActive ? "#02a0a0" : "#c1cdcf",
                fontWeight: isActive ? 600 : 400,
              }}
            >
              {node.name}
            </span>
          </div>

          {node.issuesCount ? (
            <span
              className="shrink-0 rounded px-1.5 font-mono text-[9px] font-bold"
              style={{
                background: "rgba(255,189,101,0.15)",
                color: "#ffbd65",
                paddingTop: "1px",
                paddingBottom: "1px",
              }}
            >
              {node.issuesCount}
            </span>
          ) : null}
        </button>
      );
    });
  };

  return (
    <div
      className="flex h-full flex-col overflow-hidden rounded-xl p-3 shadow-md"
      style={{
        background: "#0e2229",
        border: "1px solid rgba(2,160,160,0.14)",
      }}
    >
      {/* Eyebrow Label + Count */}
      <div className="mb-2.5 flex items-center justify-between px-1">
        <span
          className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em]"
          style={{ color: "#02a0a0" }}
        >
          FILES
        </span>
        <span
          className="rounded px-1.5 font-mono text-[10px]"
          style={{
            background: "#163842",
            color: "#8ca0a8",
            paddingTop: "1px",
            paddingBottom: "1px",
          }}
        >
          {files.length}
        </span>
      </div>

      {/* Filter / Search Input */}
      <div className="relative mb-3">
        <Search
          size={12}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: "#63777d" }}
        />
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter files..."
          className="h-8 w-full rounded-lg pl-8 pr-2.5 font-mono text-xs focus:outline-none"
          style={{
            background: "#08151a",
            border: "1px solid rgba(2,160,160,0.15)",
            color: "#f2f5f4",
          }}
          onFocus={(e) => {
            (e.target as HTMLInputElement).style.borderColor = "rgba(2,160,160,0.5)";
          }}
          onBlur={(e) => {
            (e.target as HTMLInputElement).style.borderColor = "rgba(2,160,160,0.15)";
          }}
        />
      </div>

      {/* Tree View Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-0.5 pr-0.5 scrollbar-thin">
        {tree.length === 0 ? (
          <div className="py-8 text-center font-mono text-xs" style={{ color: "#8ca0a8" }}>
            No matching files
          </div>
        ) : (
          renderNodes(tree)
        )}
      </div>

      {/* Bottom Status */}
      <div
        className="mt-2 shrink-0 px-1 pt-2 flex items-center justify-between font-mono text-[10px]"
        style={{
          borderTop: "1px solid rgba(2,160,160,0.1)",
          color: "#8ca0a8",
        }}
      >
        <span style={{ color: "#02a0a0", fontWeight: 500 }}>Tree View</span>
        <span>{filteredFiles.length} visible</span>
      </div>
    </div>
  );
}
