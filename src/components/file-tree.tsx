'use client';

import React from 'react';
import { File, Folder, FolderOpen, CheckCircle, Clock, Circle } from 'lucide-react';

interface FileTreeNode {
  name: string;
  type: 'file' | 'directory';
  children?: FileTreeNode[];
  status?: 'pending' | 'building' | 'complete' | 'pushed';
}

interface FileTreeProps {
  tree: FileTreeNode[];
  maxHeight?: string;
}

function buildTreeFromPaths(paths: string[]): FileTreeNode[] {
  const root: FileTreeNode[] = [];

  for (const path of paths) {
    const parts = path.split('/');
    let currentLevel = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;
      const existing = currentLevel.find((n) => n.name === part);

      if (existing) {
        if (existing.children) {
          currentLevel = existing.children;
        }
      } else {
        const newNode: FileTreeNode = {
          name: part,
          type: isFile ? 'file' : 'directory',
          children: isFile ? undefined : [],
          status: 'complete',
        };
        currentLevel.push(newNode);
        if (!isFile && newNode.children) {
          currentLevel = newNode.children;
        }
      }
    }
  }

  return root.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

function StatusIcon({ status }: { status?: string }) {
  switch (status) {
    case 'complete':
    case 'pushed':
      return <CheckCircle className="w-3.5 h-3.5" style={{ color: '#3fb950' }} />;
    case 'building':
      return <Clock className="w-3.5 h-3.5 animate-spin" style={{ color: '#58a6ff' }} />;
    case 'pending':
    default:
      return <Circle className="w-3.5 h-3.5" style={{ color: '#484f58' }} />;
  }
}

function TreeNode({ node, depth = 0 }: { node: FileTreeNode; depth?: number }) {
  const [isOpen, setIsOpen] = React.useState(true);
  const isDir = node.type === 'directory';

  return (
    <div>
      <div
        className="flex items-center gap-1.5 py-0.5 px-1 rounded cursor-pointer hover:bg-[#21262d] transition-colors"
        style={{ paddingLeft: `${depth * 16 + 4}px` }}
        onClick={() => isDir && setIsOpen(!isOpen)}
      >
        {isDir ? (
          isOpen ? (
            <FolderOpen className="w-3.5 h-3.5 shrink-0" style={{ color: '#58a6ff' }} />
          ) : (
            <Folder className="w-3.5 h-3.5 shrink-0" style={{ color: '#58a6ff' }} />
          )
        ) : (
          <File className="w-3.5 h-3.5 shrink-0" style={{ color: '#8b949e' }} />
        )}
        <span className="text-xs font-mono flex-1 truncate" style={{ color: isDir ? '#c9d1d9' : '#8b949e' }}>
          {node.name}
        </span>
        <StatusIcon status={node.status} />
      </div>
      {isDir && isOpen && node.children?.map((child, i) => (
        <TreeNode key={`${child.name}-${i}`} node={child} depth={depth + 1} />
      ))}
    </div>
  );
}

export function FileTree({ tree, maxHeight = '500px' }: FileTreeProps) {
  return (
    <div
      className="rounded-lg border p-3 overflow-y-auto"
      style={{ borderColor: '#30363d', backgroundColor: '#0d1117', maxHeight }}
    >
      {tree.length === 0 ? (
        <p className="text-xs text-center py-4" style={{ color: '#8b949e' }}>
          No files generated yet
        </p>
      ) : (
        tree.map((node, i) => <TreeNode key={`${node.name}-${i}`} node={node} depth={0} />)
      )}
    </div>
  );
}

export { buildTreeFromPaths };
export type { FileTreeNode };
