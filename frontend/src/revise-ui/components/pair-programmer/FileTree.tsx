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
  Sparkles,
  GitPullRequest,
  FileCheck,
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
  if (name.endsWith(".ts") || name.endsWith(".tsx") || name.endsWith(".js") || name.endsWith(".jsx")) {
    return <FileCode size={13} className="text-brand shrink-0" />;
  }
  if (name.endsWith(".py")) {
    return <FileCode size={13} className="text-attention shrink-0" />;
  }
  if (name.endsWith(".diff") || name.endsWith(".patch")) {
    return <GitPullRequest size={13} className="text-info shrink-0" />;
  }
  if (name.endsWith(".json") || name.endsWith(".md")) {
    return <FileText size={13} className="text-muted shrink-0" />;
  }
  return <FileCode size={13} className="text-muted shrink-0" />;
}

// Convert a flat list of paths into a nested tree structure
function buildFileTree(paths: string[], issuesMap: Record<string, number> = {}): FileTreeNode[] {
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
          issuesCount: isFile ? issuesMap[currentPath] || issuesMap[part] || 0 : 0,
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
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
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

  // Filter files matching query
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
              className="flex w-full items-center gap-1.5 py-1 text-left font-mono text-xs text-muted hover:text-ink hover:bg-surface-raised rounded transition-colors"
            >
              {isExpanded ? (
                <ChevronDown size={11} className="text-muted/60 shrink-0" />
              ) : (
                <ChevronRight size={11} className="text-muted/60 shrink-0" />
              )}
              {isExpanded ? (
                <FolderOpen size={13} className="text-brand/70 shrink-0" />
              ) : (
                <Folder size={13} className="text-brand/70 shrink-0" />
              )}
              <span className="truncate text-secondary font-medium">{node.name}</span>
            </button>

            {isExpanded && node.children && (
              <div className="space-y-0.5">{renderNodes(node.children, depth + 1)}</div>
            )}
          </div>
        );
      }

      // File Node
      const isActive =
        activeFile === node.path ||
        activeFile.endsWith(node.name) ||
        node.path.endsWith(activeFile);

      return (
        <button
          key={node.id}
          type="button"
          onClick={() => onSelectFile(node.path)}
          style={{ paddingLeft: `${depth * 12 + 18}px` }}
          className={`group flex w-full items-center justify-between py-1.5 pr-2.5 text-left font-mono text-xs transition-all duration-150 ${
            isActive
              ? "border-l-2 border-brand bg-brand/12 text-brand font-medium"
              : "border-l-2 border-transparent text-secondary hover:bg-surface-raised hover:text-ink"
          }`}
        >
          <div className="flex min-w-0 items-center gap-2">
            {getFileIcon(node.name)}
            <span className="truncate">{node.name}</span>
          </div>

          {node.issuesCount ? (
            <span className="shrink-0 rounded bg-attention/15 px-1.5 py-0.2 font-mono text-[9px] font-bold text-attention">
              {node.issuesCount}
            </span>
          ) : null}
        </button>
      );
    });
  };

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-line bg-surface p-3 shadow-md">
      {/* Eyebrow Label & Count */}
      <div className="mb-2.5 flex items-center justify-between px-1">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-brand font-semibold">
          FILES
        </span>
        <span className="rounded bg-surface-strong px-1.5 py-0.2 font-mono text-[10px] text-muted">
          {files.length}
        </span>
      </div>

      {/* Filter / Search Input */}
      <div className="relative mb-3">
        <Search
          size={12}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted/60 pointer-events-none"
        />
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter files…"
          className="h-8 w-full rounded-lg border border-line bg-[#08151a] pl-8 pr-2.5 font-mono text-xs text-ink placeholder:text-muted/50 focus:border-brand/60 focus:outline-none"
        />
      </div>

      {/* Tree View Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-0.5 pr-1">
        {tree.length === 0 ? (
          <div className="py-8 text-center font-mono text-xs text-muted">
            No matching files
          </div>
        ) : (
          renderNodes(tree)
        )}
      </div>

      {/* Bottom Status / Summary */}
      <div className="mt-2 shrink-0 border-t border-line/60 pt-2 px-1 flex items-center justify-between font-mono text-[10px] text-muted">
        <span className="text-brand font-medium">Tree View</span>
        <span>{filteredFiles.length} visible</span>
      </div>
    </div>
  );
}
