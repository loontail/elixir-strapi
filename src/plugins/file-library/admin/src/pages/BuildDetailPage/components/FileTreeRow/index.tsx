import { memo, Fragment } from 'react';
import { useTheme, BaseCheckbox, Typography, IconButton, SimpleMenu, MenuItem } from '@strapi/design-system';
import { More } from '@strapi/icons';
import { useIntl } from 'react-intl';
import { PencilIcon, UploadIcon, HashIcon, TrashIcon, FolderIcon, FileIcon, ChevronRightIcon, ChevronDownIcon } from '../../../../components/Icons';
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
  onToggleExpand: (key: string) => void;
  onToggleFile: (id: number) => void;
  onToggleDir: (node: TreeNode) => void;
  onContextAction: (type: string, entry: FileEntry) => void;
  onToggleDownloadOnce: (entry: FileEntry) => void;
}

const formatDate = (raw?: string): string => {
  if (!raw) return '—';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return '—';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const FileTreeRow = memo(({
  row: { node, depth, lineFlags },
  expanded,
  selected,
  missingIds,
  slug,
  onToggleExpand,
  onToggleFile,
  onToggleDir,
  onContextAction,
  onToggleDownloadOnce,
}: FileTreeRowProps) => {
  // useTheme is still needed for icon color props which can't be expressed as CSS
  const theme = useTheme();
  const c = theme.colors;
  const { formatMessage } = useIntl();
  const t = (id: string, values?: Record<string, string | number>) =>
    formatMessage({ id: getTranslation(id), defaultMessage: id }, values);

  // VS Code-style tree connector lines
  const guideLines = depth === 0 ? null : Array.from({ length: depth }, (_, i) => {
    const isImmediate = i === depth - 1;
    const continues = isImmediate ? lineFlags[depth] : lineFlags[i + 1];
    if (!isImmediate && !continues) return null;
    const spineX = i * 20 + 14;
    return (
      <Fragment key={i}>
        <GuideSpine $x={spineX} $continues={!!continues} />
        {isImmediate && <GuideHorizontal $x={spineX} />}
      </Fragment>
    );
  });

  if (node.isDir) {
    const dirIds = getFileIds(node);
    const allSel = dirIds.length > 0 && dirIds.every((id) => selected.has(id));
    const someSel = !allSel && dirIds.some((id) => selected.has(id));
    const isOpen = expanded.has(node.key);

    return (
      <DirRow $selected={allSel} $partial={someSel}>
        <CheckCell>
          {dirIds.length > 0 && (
            <BaseCheckbox
              aria-label={t('buildDetail.selectDir', { name: node.name })}
              checked={someSel ? 'indeterminate' : allSel}
              onChange={() => onToggleDir(node)}
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
            {isOpen ? <ChevronDownIcon color={c.neutral300} /> : <ChevronRightIcon color={c.neutral300} />}
          </ExpandButton>
          <FolderIcon size={16} color={isOpen ? c.primary600 : c.warning600} />
          <DirName>{node.name}</DirName>
          <DirCount>{dirIds.length}</DirCount>
        </NameCell>
        <EmptyCell style={undefined} /><EmptyCell style={undefined} /><EmptyCell style={undefined} /><EmptyCell style={undefined} />
        <ActCell>
          {node.entry && (
            <SimpleMenu label={t('buildDetail.folderActions')} as={IconButton} icon={<More />}>
              <MenuItem onClick={() => onContextAction('rename', node.entry!)}>
                <MenuItemRow><PencilIcon />{t('buildDetail.action.rename')}</MenuItemRow>
              </MenuItem>
              <MenuItem onClick={() => onContextAction('delete', node.entry!)}>
                <MenuItemRow><TrashIcon /><DangerLabel>{t('buildDetail.action.deleteFolder')}</DangerLabel></MenuItemRow>
              </MenuItem>
            </SimpleMenu>
          )}
        </ActCell>
      </DirRow>
    );
  }

  const entry = node.entry!;
  const isSel = selected.has(entry.id);
  const isMissing = missingIds.has(entry.id);

  return (
    <FileRow $missing={isMissing} $selected={isSel}>
      <CheckCell>
        <BaseCheckbox
          aria-label={t('buildDetail.selectFile', { name: entry.name })}
          checked={isSel}
          onChange={() => onToggleFile(entry.id)}
        />
      </CheckCell>
      <NameCell $depth={depth}>
        {guideLines}
        <ExpandSpacer />
        <FileIcon size={14} color={c.primary500} />
        {isMissing && <MissingBadge>{t('buildDetail.missing.badge')}</MissingBadge>}
        <FileNameOverflow>
          <FileNameLink
            href={`${window.location.origin}/file-library/builds/${slug}/files/${entry.relativePath}`}
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
            title={`Click to copy: ${entry.sha256}`}
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
          aria-label={t('buildDetail.downloadOnce.label', {
            state: t(entry.downloadOnce ? 'buildDetail.downloadOnce.on' : 'buildDetail.downloadOnce.off'),
          })}
          onClick={() => onToggleDownloadOnce(entry)}
        >
          <ToggleTrack $active={entry.downloadOnce}>
            <ToggleThumb $active={entry.downloadOnce} />
          </ToggleTrack>
        </ToggleButton>
      </DlCell>
      <ActCell>
        <SimpleMenu label={t('buildDetail.fileActions')} as={IconButton} icon={<More />}>
          <MenuItem onClick={() => onContextAction('rename', entry)}>
            <MenuItemRow><PencilIcon />{t('buildDetail.action.rename')}</MenuItemRow>
          </MenuItem>
          <MenuItem onClick={() => onContextAction('replace', entry)}>
            <MenuItemRow><UploadIcon />{t('buildDetail.action.replace')}</MenuItemRow>
          </MenuItem>
          <MenuItem onClick={() => onContextAction('rehash', entry)}>
            <MenuItemRow><HashIcon />{t('buildDetail.action.rehash')}</MenuItemRow>
          </MenuItem>
          <MenuItem onClick={() => onContextAction('delete', entry)}>
            <MenuItemRow><TrashIcon /><DangerLabel>{t('buildDetail.action.delete')}</DangerLabel></MenuItemRow>
          </MenuItem>
        </SimpleMenu>
      </ActCell>
    </FileRow>
  );
});

FileTreeRow.displayName = 'FileTreeRow';

export { FileTreeRow };
