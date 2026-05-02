import { memo, Fragment } from 'react';
import { useTheme } from 'styled-components';
import { Checkbox, Typography, IconButton, SimpleMenu, MenuItem } from '@strapi/design-system';
import { More } from '@strapi/icons';
import { useIntl } from 'react-intl';
import { PencilIcon, UploadIcon, HashIcon, TrashIcon, FolderIcon, FolderOpenIcon, FileIcon, ChevronRightIcon, ChevronDownIcon } from '../../../../components/Icons';
import { formatBytes } from '../../../../utils/formatBytes';
import { getTranslation } from '../../../../utils/getTranslation';
import { getFileIds } from '../../hooks/useFileTree';
import {
  DirRow,
  FileRow,
  CheckCell,
  NameCell,
  SizeCell,
  ModCell,
  HashCell,
  DlCell,
  ActCell,
  EmptyCell,
  GuideSpine,
  GuideHorizontal,
  ExpandButton,
  ExpandSpacer,
  DirName,
  DirCount,
  MissingBadge,
  FileNameOverflow,
  FileNameLink,
  HashChip,
  ToggleButton,
  ToggleTrack,
  ToggleThumb,
  MenuItemRow,
  DangerLabel,
} from './styles';
import type { FlatRow, TreeNode } from '../../hooks/useFileTree';
import type { FileEntry } from '../../../../../../shared/types/entities';

interface FileTreeRowProps {
  row: FlatRow;
  expanded: Set<string>;
  selected: Set<number>;
  missingIds: Set<number>;
  slug: string;
  isDragOver: boolean;
  draggedEntryId: number | null;
  onToggleExpand: (key: string) => void;
  onToggleFile: (id: number) => void;
  onToggleDir: (node: TreeNode) => void;
  onContextAction: (type: string, entry: FileEntry) => void;
  onToggleDownloadOnce: (entry: FileEntry) => void;
  onDragStart: (entry: FileEntry) => void;
  onDragEnd: () => void;
  onDragOverDir: (key: string) => void;
  onDragLeaveDir: () => void;
  onDropOnDir: (node: TreeNode) => void;
}

const formatDate = (raw?: string): string => {
  if (!raw) return '—';
  const date = new Date(raw);
  if (isNaN(date.getTime())) return '—';
  const pad = (num: number) => String(num).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const FileTreeRow = memo(({
  row: { node, depth, lineFlags },
  expanded,
  selected,
  missingIds,
  slug,
  isDragOver,
  onToggleExpand,
  onToggleFile,
  onToggleDir,
  onContextAction,
  onToggleDownloadOnce,
  onDragStart,
  onDragEnd,
  onDragOverDir,
  onDragLeaveDir,
  onDropOnDir,
}: FileTreeRowProps) => {
  const theme = useTheme();
  const colors = theme.colors;
  const { formatMessage } = useIntl();
  const translate = (id: string, values?: Record<string, string | number>) =>
    formatMessage({ id: getTranslation(id), defaultMessage: id }, values);

  const guideLines = depth === 0 ? null : Array.from({ length: depth }, (_, depthIndex) => {
    const isImmediate = depthIndex === depth - 1;
    const continues = isImmediate ? lineFlags[depth] : lineFlags[depthIndex + 1];
    if (!isImmediate && !continues) return null;
    const spineX = depthIndex * 20 + 14;
    return (
      <Fragment key={depthIndex}>
        <GuideSpine $x={spineX} $continues={!!continues} />
        {isImmediate && <GuideHorizontal $x={spineX} />}
      </Fragment>
    );
  });

  if (node.isDir) {
    const dirIds = getFileIds(node);
    const allSelected = dirIds.length > 0 && dirIds.every((id) => selected.has(id));
    const someSelected = !allSelected && dirIds.some((id) => selected.has(id));
    const isOpen = expanded.has(node.key);

    const isDraggableDir = !!node.entry;

    return (
      <DirRow
        $selected={allSelected}
        $partial={someSelected}
        $dragOver={isDragOver}
        draggable={isDraggableDir}
        onDragStart={isDraggableDir ? (event: React.DragEvent) => {
          event.dataTransfer.effectAllowed = 'move';
          onDragStart(node.entry!);
        } : undefined}
        onDragEnd={isDraggableDir ? onDragEnd : undefined}
        onDragOver={(event: React.DragEvent) => {
          event.preventDefault();
          event.dataTransfer.dropEffect = 'move';
          onDragOverDir(node.key);
        }}
        onDragEnter={(event: React.DragEvent) => {
          event.preventDefault();
          onDragOverDir(node.key);
        }}
        onDragLeave={(event: React.DragEvent) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node)) {
            onDragLeaveDir();
          }
        }}
        onDrop={(event: React.DragEvent) => {
          event.preventDefault();
          onDropOnDir(node);
        }}
      >
        <CheckCell>
          {dirIds.length > 0 && (
            <Checkbox
              aria-label={translate('buildDetail.selectDir', { name: node.name })}
              checked={someSelected ? 'indeterminate' : allSelected}
              onCheckedChange={() => onToggleDir(node)}
            />
          )}
        </CheckCell>
        <NameCell $depth={depth}>
          {guideLines}
          <ExpandButton
            type="button"
            onClick={() => onToggleExpand(node.key)}
            aria-expanded={isOpen}
          >
            {isOpen
              ? <ChevronDownIcon color={colors.neutral300} />
              : <ChevronRightIcon color={colors.neutral300} />}
          </ExpandButton>
          {isOpen
            ? <FolderOpenIcon size={16} color={colors.warning600} />
            : <FolderIcon size={16} color={colors.warning600} />}
          <DirName>{node.name}</DirName>
          <DirCount>{dirIds.length}</DirCount>
        </NameCell>
        <EmptyCell style={undefined} /><EmptyCell style={undefined} /><EmptyCell style={undefined} /><EmptyCell style={undefined} />
        <ActCell>
          {node.entry && (
            <SimpleMenu label={translate('buildDetail.folderActions')} tag={IconButton} icon={<More />}>
              <MenuItem onClick={() => onContextAction('rename', node.entry!)}>
                <MenuItemRow><PencilIcon />{translate('buildDetail.action.rename')}</MenuItemRow>
              </MenuItem>
              <MenuItem onClick={() => onContextAction('delete', node.entry!)}>
                <MenuItemRow><TrashIcon /><DangerLabel>{translate('buildDetail.action.deleteFolder')}</DangerLabel></MenuItemRow>
              </MenuItem>
            </SimpleMenu>
          )}
        </ActCell>
      </DirRow>
    );
  }

  const entry = node.entry!;
  const isSelected = selected.has(entry.id);
  const isMissing = missingIds.has(entry.id);

  return (
    <FileRow
      $missing={isMissing}
      $selected={isSelected}
      draggable
      onDragStart={(event: React.DragEvent) => {
        event.dataTransfer.effectAllowed = 'move';
        onDragStart(entry);
      }}
      onDragEnd={onDragEnd}
    >
      <CheckCell>
        <Checkbox
          aria-label={translate('buildDetail.selectFile', { name: entry.name })}
          checked={isSelected}
          onCheckedChange={() => onToggleFile(entry.id)}
        />
      </CheckCell>
      <NameCell $depth={depth}>
        {guideLines}
        <ExpandSpacer />
        <FileIcon size={14} color={colors.primary500} />
        {isMissing && <MissingBadge>{translate('buildDetail.missing.badge')}</MissingBadge>}
        <FileNameOverflow>
          <FileNameLink
            href={`${window.location.origin}/bundle-registry/builds/${slug}/files/${entry.relativePath}`}
            target="_blank"
            rel="noopener noreferrer"
            title={entry.relativePath}
          >
            {entry.name}
          </FileNameLink>
        </FileNameOverflow>
      </NameCell>
      <SizeCell>{formatBytes(entry.size)}</SizeCell>
      <ModCell>{formatDate(entry.fileModifiedAt)}</ModCell>
      <HashCell>
        {entry.sha256 ? (
          <HashChip
            title={translate('buildDetail.table.hashChip.copyTitle', { hash: entry.sha256 })}
            onClick={() => navigator.clipboard.writeText(entry.sha256!)}
          >
            …{entry.sha256.slice(-12)}
          </HashChip>
        ) : (
          <Typography variant="omega" textColor="neutral400">—</Typography>
        )}
      </HashCell>
      <DlCell>
        <ToggleButton
          type="button"
          aria-label={translate('buildDetail.downloadOnce.label', {
            state: translate(entry.downloadOnce ? 'buildDetail.downloadOnce.on' : 'buildDetail.downloadOnce.off'),
          })}
          onClick={() => onToggleDownloadOnce(entry)}
        >
          <ToggleTrack $active={entry.downloadOnce}>
            <ToggleThumb $active={entry.downloadOnce} />
          </ToggleTrack>
        </ToggleButton>
      </DlCell>
      <ActCell>
        <SimpleMenu label={translate('buildDetail.fileActions')} tag={IconButton} icon={<More />}>
          <MenuItem onClick={() => onContextAction('rename', entry)}>
            <MenuItemRow><PencilIcon />{translate('buildDetail.action.rename')}</MenuItemRow>
          </MenuItem>
          <MenuItem onClick={() => onContextAction('replace', entry)}>
            <MenuItemRow><UploadIcon />{translate('buildDetail.action.replace')}</MenuItemRow>
          </MenuItem>
          <MenuItem onClick={() => onContextAction('rehash', entry)}>
            <MenuItemRow><HashIcon />{translate('buildDetail.action.rehash')}</MenuItemRow>
          </MenuItem>
          <MenuItem onClick={() => onContextAction('delete', entry)}>
            <MenuItemRow><TrashIcon /><DangerLabel>{translate('buildDetail.action.delete')}</DangerLabel></MenuItemRow>
          </MenuItem>
        </SimpleMenu>
      </ActCell>
    </FileRow>
  );
});

FileTreeRow.displayName = 'FileTreeRow';

export { FileTreeRow };
