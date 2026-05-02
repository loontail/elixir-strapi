import { useState, useMemo, useCallback } from 'react';
import type { FileEntry } from '../../../../../shared/types/entities';

export interface TreeNode {
  key: string;
  name: string;
  isDir: boolean;
  entry: FileEntry | null;
  children: TreeNode[];
}

export interface FlatRow {
  node: TreeNode;
  depth: number;
  lineFlags: boolean[];
}

const buildFileTree = (files: FileEntry[], dirEntriesMap: Map<string, FileEntry>): TreeNode[] => {
  const nodeMap = new Map<string, TreeNode>();
  files.forEach((file) => {
    const parts = file.relativePath.split('/');
    for (let partIndex = 1; partIndex < parts.length; partIndex++) {
      const dirPath = parts.slice(0, partIndex).join('/');
      if (!nodeMap.has(dirPath)) {
        nodeMap.set(dirPath, {
          key: dirPath,
          name: parts[partIndex - 1],
          isDir: true,
          entry: dirEntriesMap.get(dirPath) ?? null,
          children: [],
        });
      }
    }
    nodeMap.set(file.relativePath, {
      key: file.relativePath,
      name: file.name,
      isDir: false,
      entry: file,
      children: [],
    });
  });

  const roots: TreeNode[] = [];
  nodeMap.forEach((node, nodePath) => {
    const parts = nodePath.split('/');
    if (parts.length === 1) {
      roots.push(node);
    } else {
      const parent = nodeMap.get(parts.slice(0, -1).join('/'));
      if (parent) parent.children.push(node);
      else roots.push(node);
    }
  });

  const sortNodes = (nodes: TreeNode[]): void => {
    nodes.sort((a, b) => {
      if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    nodes.forEach((node) => sortNodes(node.children));
  };
  sortNodes(roots);
  return roots;
};

const flattenTree = (
  nodes: TreeNode[],
  depth: number,
  expanded: Set<string>,
  hasMore: boolean[] = [],
): FlatRow[] => {
  const rows: FlatRow[] = [];
  nodes.forEach((node, index) => {
    const isLast = index === nodes.length - 1;
    const lineFlags = [...hasMore, !isLast];
    rows.push({ node, depth, lineFlags });
    if (node.isDir && expanded.has(node.key)) {
      rows.push(...flattenTree(node.children, depth + 1, expanded, lineFlags));
    }
  });
  return rows;
};

export const getFileIds = (node: TreeNode): number[] => {
  if (!node.isDir) return node.entry ? [node.entry.id] : [];
  return node.children.flatMap(getFileIds);
};

interface UseFileTreeResult {
  rows: FlatRow[];
  expanded: Set<string>;
  selected: Set<number>;
  search: string;
  allFileIds: number[];
  allSelected: boolean;
  someSelected: boolean;
  filteredFiles: FileEntry[];
  files: FileEntry[];
  setSearch: (query: string) => void;
  toggleExpand: (key: string) => void;
  toggleFile: (id: number) => void;
  toggleDir: (node: TreeNode) => void;
  toggleAll: () => void;
  resetSelected: () => void;
}

const useFileTree = (fileEntries: FileEntry[]): UseFileTreeResult => {
  const [expanded, setExpanded] = useState(new Set<string>());
  const [selected, setSelected] = useState(new Set<number>());
  const [search, setSearch] = useState('');

  const files = useMemo(() => fileEntries.filter((entry) => !entry.isDir), [fileEntries]);

  const dirEntriesMap = useMemo(() => {
    const map = new Map<string, FileEntry>();
    fileEntries
      .filter((entry) => entry.isDir)
      .forEach((dirEntry) => map.set(dirEntry.relativePath, dirEntry));
    return map;
  }, [fileEntries]);

  const filteredFiles = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return files;
    return files.filter(
      (file) =>
        file.relativePath.toLowerCase().includes(query) || file.name.toLowerCase().includes(query),
    );
  }, [files, search]);

  const tree = useMemo(
    () => buildFileTree(filteredFiles, dirEntriesMap),
    [filteredFiles, dirEntriesMap],
  );

  const effectiveExpanded = useMemo(() => {
    if (!search.trim()) return expanded;
    const allDirs = new Set<string>();
    const collect = (nodes: TreeNode[]) => {
      nodes.forEach((node) => {
        if (node.isDir) {
          allDirs.add(node.key);
          collect(node.children);
        }
      });
    };
    collect(tree);
    return allDirs;
  }, [search, tree, expanded]);

  const rows = useMemo(() => flattenTree(tree, 0, effectiveExpanded), [tree, effectiveExpanded]);

  const allFileIds = useMemo(() => files.map((file) => file.id), [files]);
  const allSelected = allFileIds.length > 0 && allFileIds.every((id) => selected.has(id));
  const someSelected = !allSelected && allFileIds.some((id) => selected.has(id));

  const toggleExpand = useCallback((key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }, []);

  const toggleFile = useCallback((id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const toggleDir = useCallback(
    (node: TreeNode) => {
      const ids = getFileIds(node);
      const allIn = ids.every((id) => selected.has(id));
      setSelected((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => (allIn ? next.delete(id) : next.add(id)));
        return next;
      });
    },
    [selected],
  );

  const toggleAll = useCallback(() => {
    setSelected(allSelected ? new Set() : new Set(allFileIds));
  }, [allSelected, allFileIds]);

  const resetSelected = useCallback(() => setSelected(new Set()), []);

  return {
    rows,
    expanded,
    selected,
    search,
    allFileIds,
    allSelected,
    someSelected,
    filteredFiles,
    files,
    setSearch,
    toggleExpand,
    toggleFile,
    toggleDir,
    toggleAll,
    resetSelected,
  };
};

export { useFileTree };
