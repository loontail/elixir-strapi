import { useState, useMemo, useCallback } from 'react';
import type { Artifact } from '../../../../../shared/types/entities';

export interface TreeNode {
  key: string;
  name: string;
  isDir: boolean;
  entry: Artifact | null;
  children: TreeNode[];
}

export interface FlatRow {
  node: TreeNode;
  depth: number;
  lineFlags: boolean[];
}

const buildFileTree = (
  files: Artifact[],
  dirEntriesMap: Map<string, Artifact>,
  extraDirs: Artifact[],
): TreeNode[] => {
  const nodeMap = new Map<string, TreeNode>();

  const ensureDirChain = (relativePath: string): void => {
    const parts = relativePath.split('/');
    for (let partIndex = 1; partIndex <= parts.length; partIndex++) {
      const dirPath = parts.slice(0, partIndex).join('/');
      if (nodeMap.has(dirPath)) continue;
      nodeMap.set(dirPath, {
        key: dirPath,
        name: parts[partIndex - 1],
        isDir: true,
        entry: dirEntriesMap.get(dirPath) ?? null,
        children: [],
      });
    }
  };

  files.forEach((file) => {
    const parts = file.relativePath.split('/');
    if (parts.length > 1) ensureDirChain(parts.slice(0, -1).join('/'));
    nodeMap.set(file.relativePath, {
      key: file.relativePath,
      name: file.name,
      isDir: false,
      entry: file,
      children: [],
    });
  });

  extraDirs.forEach((dir) => ensureDirChain(dir.relativePath));

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

// Selectable IDs include the folder's own entry alongside descendants —
// used by checkbox state and bulk-delete so empty folders are also reachable.
export const getNodeSelectionIds = (node: TreeNode): number[] => {
  if (!node.isDir) return node.entry ? [node.entry.id] : [];
  const own = node.entry ? [node.entry.id] : [];
  return [...own, ...node.children.flatMap(getNodeSelectionIds)];
};

interface UseFileTreeResult {
  rows: FlatRow[];
  expanded: Set<string>;
  selected: Set<number>;
  search: string;
  allSelected: boolean;
  someSelected: boolean;
  filteredFiles: Artifact[];
  files: Artifact[];
  setSearch: (query: string) => void;
  toggleExpand: (key: string) => void;
  toggleFile: (id: number) => void;
  toggleDir: (node: TreeNode) => void;
  toggleAll: () => void;
  resetSelected: () => void;
}

const useFileTree = (artifacts: Artifact[]): UseFileTreeResult => {
  const [expanded, setExpanded] = useState(new Set<string>());
  const [selected, setSelected] = useState(new Set<number>());
  const [search, setSearch] = useState('');

  const files = useMemo(() => artifacts.filter((entry) => !entry.isDir), [artifacts]);

  const dirArtifacts = useMemo(
    () => artifacts.filter((entry) => entry.isDir),
    [artifacts],
  );

  const dirEntriesMap = useMemo(() => {
    const map = new Map<string, Artifact>();
    dirArtifacts.forEach((dirEntry) => map.set(dirEntry.relativePath, dirEntry));
    return map;
  }, [dirArtifacts]);

  const filteredFiles = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return files;
    return files.filter(
      (file) =>
        file.relativePath.toLowerCase().includes(query) || file.name.toLowerCase().includes(query),
    );
  }, [files, search]);

  const filteredDirs = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return dirArtifacts;
    return dirArtifacts.filter(
      (dir) =>
        dir.relativePath.toLowerCase().includes(query) || dir.name.toLowerCase().includes(query),
    );
  }, [dirArtifacts, search]);

  const tree = useMemo(
    () => buildFileTree(filteredFiles, dirEntriesMap, filteredDirs),
    [filteredFiles, dirEntriesMap, filteredDirs],
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
      const ids = getNodeSelectionIds(node);
      if (ids.length === 0) return;
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
