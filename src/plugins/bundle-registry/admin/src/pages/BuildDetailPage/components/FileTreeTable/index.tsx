import { memo, useState, useCallback } from 'react';
import { useTheme, BaseCheckbox, Tooltip } from '@strapi/design-system';
import { useIntl } from 'react-intl';
import { FileTreeRow } from '../FileTreeRow';
import {
  TableRoot,
  HeaderRow,
  HeaderCheckCell,
  HeaderNameCell,
  HeaderSizeCell,
  HeaderModCell,
  HeaderHashCell,
  HeaderDlCell,
  HeaderActCell,
} from './styles';
import {
  DirRow,
  CheckCell,
  NameCell,
  ActCell,
  EmptyCell,
  ExpandButton,
  DirName,
  DirCount,
} from '../FileTreeRow/styles';
import { ChevronDownIcon, ChevronRightIcon, FolderIcon, FolderOpenIcon } from '../../../../components/Icons';
import { getTranslation } from '../../../../utils/getTranslation';
import type { FlatRow, TreeNode } from '../../hooks/useFileTree';
import type { FileEntry } from '../../../../../../shared/types/entities';

interface FileTreeTableProps {
  rows: FlatRow[];
  expanded: Set<string>;
  selected: Set<number>;
  missingIds: Set<number>;
  slug: string;
  buildName: string;
  totalFiles: number;
  allSelected: boolean;
  someSelected: boolean;
  onToggleAll: () => void;
  onToggleExpand: (key: string) => void;
  onToggleFile: (id: number) => void;
  onToggleDir: (node: TreeNode) => void;
  onContextAction: (type: string, entry: FileEntry) => void;
  onToggleDownloadOnce: (entry: FileEntry) => void;
  onMove: (entry: FileEntry, newPath: string) => Promise<void>;
}

const FileTreeTable = memo(
  ({
    rows,
    expanded,
    selected,
    missingIds,
    slug,
    buildName,
    totalFiles,
    allSelected,
    someSelected,
    onToggleAll,
    onToggleExpand,
    onToggleFile,
    onToggleDir,
    onContextAction,
    onToggleDownloadOnce,
    onMove,
  }: FileTreeTableProps) => {
    const theme = useTheme();
    const colors = theme.colors;
    const { formatMessage } = useIntl();
    const translate = (id: string) => formatMessage({ id: getTranslation(id), defaultMessage: id });

    const [draggedEntry, setDraggedEntry] = useState<FileEntry | null>(null);
    const [dragOverKey, setDragOverKey] = useState<string | null>(null);
    const [isRootDragOver, setIsRootDragOver] = useState(false);
    const [isRootExpanded, setIsRootExpanded] = useState(true);

    const handleDragStart = useCallback((entry: FileEntry) => {
      setDraggedEntry(entry);
    }, []);

    const handleDragEnd = useCallback(() => {
      setDraggedEntry(null);
      setDragOverKey(null);
      setIsRootDragOver(false);
    }, []);

    const handleDragOverDir = useCallback((key: string) => {
      setIsRootDragOver(false);
      setDragOverKey(key);
    }, []);

    const handleDragLeaveDir = useCallback(() => {
      setDragOverKey(null);
    }, []);

    const handleDropOnDir = useCallback(
      (node: TreeNode) => {
        setDragOverKey(null);
        if (!draggedEntry) return;
        setDraggedEntry(null);
        if (
          draggedEntry.isDir &&
          (node.key === draggedEntry.relativePath ||
            node.key.startsWith(draggedEntry.relativePath + '/'))
        ) return;
        const newPath = `${node.key}/${draggedEntry.name}`;
        if (newPath !== draggedEntry.relativePath) {
          onMove(draggedEntry, newPath);
        }
      },
      [draggedEntry, onMove],
    );

    const handleDropOnRoot = useCallback(() => {
      setIsRootDragOver(false);
      if (!draggedEntry) return;
      const entry = draggedEntry;
      setDraggedEntry(null);
      if (!entry.relativePath.includes('/')) return;
      onMove(entry, entry.name);
    }, [draggedEntry, onMove]);

    if (rows.length === 0) return null;

    return (
      <TableRoot>
        <HeaderRow>
          <HeaderCheckCell />
          <HeaderNameCell>{translate('buildDetail.table.column.name')}</HeaderNameCell>
          <HeaderSizeCell>{translate('buildDetail.table.column.size')}</HeaderSizeCell>
          <HeaderModCell>{translate('buildDetail.table.column.modified')}</HeaderModCell>
          <HeaderHashCell>{translate('buildDetail.table.column.sha256')}</HeaderHashCell>
          <HeaderDlCell>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {translate('buildDetail.table.column.once')}
              <Tooltip label={translate('buildDetail.table.column.once.tooltip')}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    border: '1px solid currentColor',
                    fontSize: 9,
                    lineHeight: 1,
                    cursor: 'help',
                    opacity: 0.6,
                    flexShrink: 0,
                  }}
                  tabIndex={0}
                >
                  ?
                </span>
              </Tooltip>
            </span>
          </HeaderDlCell>
          <HeaderActCell />
        </HeaderRow>

        <DirRow
          $selected={allSelected}
          $partial={someSelected}
          $dragOver={isRootDragOver}
          onDragOver={(event: React.DragEvent) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = 'move';
            setDragOverKey(null);
            setIsRootDragOver(true);
          }}
          onDragEnter={(event: React.DragEvent) => {
            event.preventDefault();
            setIsRootDragOver(true);
          }}
          onDragLeave={(event: React.DragEvent) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node)) {
              setIsRootDragOver(false);
            }
          }}
          onDrop={(event: React.DragEvent) => {
            event.preventDefault();
            handleDropOnRoot();
          }}
        >
          <CheckCell>
            <BaseCheckbox
              aria-label={translate('buildDetail.selectAll')}
              checked={someSelected ? 'indeterminate' : allSelected}
              onChange={onToggleAll}
            />
          </CheckCell>
          <NameCell $depth={0}>
            <ExpandButton
              type="button"
              onClick={() => setIsRootExpanded((prev) => !prev)}
              aria-expanded={isRootExpanded}
            >
              {isRootExpanded
                ? <ChevronDownIcon color={colors.neutral300} />
                : <ChevronRightIcon color={colors.neutral300} />}
            </ExpandButton>
            {isRootExpanded
              ? <FolderOpenIcon size={16} color={colors.warning600} />
              : <FolderIcon size={16} color={colors.warning600} />}
            <DirName>{buildName}</DirName>
            <DirCount>{totalFiles}</DirCount>
          </NameCell>
          <EmptyCell style={undefined} />
          <EmptyCell style={undefined} />
          <EmptyCell style={undefined} />
          <EmptyCell style={undefined} />
          <ActCell />
        </DirRow>

        {isRootExpanded && rows.map((row) => (
          <FileTreeRow
            key={row.node.isDir ? row.node.key : (row.node.entry?.id ?? row.node.key)}
            row={{ ...row, depth: row.depth + 1, lineFlags: [false, ...row.lineFlags] }}
            expanded={expanded}
            selected={selected}
            missingIds={missingIds}
            slug={slug}
            isDragOver={dragOverKey === row.node.key}
            draggedEntryId={draggedEntry?.id ?? null}
            onToggleExpand={onToggleExpand}
            onToggleFile={onToggleFile}
            onToggleDir={onToggleDir}
            onContextAction={onContextAction}
            onToggleDownloadOnce={onToggleDownloadOnce}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOverDir={handleDragOverDir}
            onDragLeaveDir={handleDragLeaveDir}
            onDropOnDir={handleDropOnDir}
          />
        ))}
      </TableRoot>
    );
  },
);

FileTreeTable.displayName = 'FileTreeTable';

export { FileTreeTable };
