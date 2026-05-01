import { memo } from 'react';
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
import { getTranslation } from '../../../../utils/getTranslation';
import type { FlatRow, TreeNode } from '../../hooks/useFileTree';
import type { FileEntry } from '../../../../../../shared/types/entities';

interface FileTreeTableProps {
  rows: FlatRow[];
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

const FileTreeTable = memo(
  ({
    rows,
    expanded,
    selected,
    missingIds,
    slug,
    onToggleExpand,
    onToggleFile,
    onToggleDir,
    onContextAction,
    onToggleDownloadOnce,
  }: FileTreeTableProps) => {
    const { formatMessage } = useIntl();
    const t = (id: string) => formatMessage({ id: getTranslation(id), defaultMessage: id });

    if (rows.length === 0) return null;

    return (
      <TableRoot>
        <HeaderRow>
          <HeaderCheckCell />
          <HeaderNameCell>{t('buildDetail.table.column.name')}</HeaderNameCell>
          <HeaderSizeCell>{t('buildDetail.table.column.size')}</HeaderSizeCell>
          <HeaderModCell>{t('buildDetail.table.column.modified')}</HeaderModCell>
          <HeaderHashCell>{t('buildDetail.table.column.sha256')}</HeaderHashCell>
          <HeaderDlCell>{t('buildDetail.table.column.once')}</HeaderDlCell>
          <HeaderActCell />
        </HeaderRow>

        {rows.map((row) => (
          <FileTreeRow
            key={row.node.isDir ? row.node.key : (row.node.entry?.id ?? row.node.key)}
            row={row}
            expanded={expanded}
            selected={selected}
            missingIds={missingIds}
            slug={slug}
            onToggleExpand={onToggleExpand}
            onToggleFile={onToggleFile}
            onToggleDir={onToggleDir}
            onContextAction={onContextAction}
            onToggleDownloadOnce={onToggleDownloadOnce}
          />
        ))}
      </TableRoot>
    );
  },
);

FileTreeTable.displayName = 'FileTreeTable';

export { FileTreeTable };
