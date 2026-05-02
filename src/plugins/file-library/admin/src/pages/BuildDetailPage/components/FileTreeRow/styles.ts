import styled, { css } from 'styled-components';

// ─── Row wrappers ────────────────────────────────────────────────────────────

const rowBase = css`
  display: flex;
  align-items: center;
  min-height: 48px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.neutral150};
`;

export const DirRow = styled.div<{ $selected: boolean; $partial: boolean; $dragOver: boolean }>`
  ${rowBase}
  cursor: grab;
  background: ${({ theme, $selected, $partial, $dragOver }) =>
    $dragOver || $selected
      ? theme.colors.primary100
      : $partial
        ? theme.colors.primary50
        : theme.colors.neutral0};
  box-shadow: inset 3px 0 0
    ${({ theme, $selected, $partial, $dragOver }) =>
      $dragOver || $selected
        ? theme.colors.primary600
        : $partial
          ? theme.colors.primary200
          : 'transparent'};
  outline: ${({ theme, $dragOver }) =>
    $dragOver ? `2px dashed ${theme.colors.primary400}` : 'none'};
  outline-offset: -2px;
  transition:
    background 0.1s,
    box-shadow 0.1s;
  &:active {
    cursor: grabbing;
  }
`;

export const FileRow = styled.div<{ $missing: boolean; $selected: boolean }>`
  ${rowBase}
  cursor: grab;
  background: ${({ theme, $missing, $selected }) =>
    $missing
      ? theme.colors.danger100
      : $selected
        ? theme.colors.primary100
        : theme.colors.neutral0};
  box-shadow: inset 3px 0 0
    ${({ theme, $missing, $selected }) =>
      $missing
        ? theme.colors.danger600
        : $selected
          ? theme.colors.primary600
          : 'transparent'};
  transition:
    background 0.1s,
    box-shadow 0.1s;
  &:active {
    cursor: grabbing;
  }
`;

// ─── Column cells ────────────────────────────────────────────────────────────

export const CheckCell = styled.div`
  width: 48px;
  min-width: 48px;
  padding-left: 13px;
  padding-right: 8px;
  flex-shrink: 0;
`;

export const NameCell = styled.div<{ $depth: number }>`
  flex: 1 1 0;
  min-width: 0;
  position: relative;
  display: flex;
  align-items: center;
  align-self: stretch;
  gap: 8px;
  padding-left: ${({ $depth }) => $depth * 20 + 4}px;
`;

export const SizeCell = styled.div`
  width: 90px;
  min-width: 80px;
  text-align: right;
  padding-right: 16px;
  flex-shrink: 0;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.neutral600};
  font-variant-numeric: tabular-nums;
`;

export const ModCell = styled.div`
  width: 140px;
  min-width: 120px;
  padding-left: 16px;
  flex-shrink: 0;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.neutral500};
  font-variant-numeric: tabular-nums;
  font-family: ui-monospace, monospace;
`;

export const HashCell = styled.div`
  width: 160px;
  min-width: 140px;
  padding-left: 16px;
  flex-shrink: 0;
`;

export const DlCell = styled.div`
  width: 120px;
  min-width: 100px;
  padding-left: 12px;
  flex-shrink: 0;
`;

export const ActCell = styled.div`
  width: 48px;
  min-width: 48px;
  text-align: center;
  flex-shrink: 0;
`;

// Empty sibling cells used in directory rows
export const EmptyCell = styled.div`
  display: flex;
`;

// ─── Tree guide lines ─────────────────────────────────────────────────────────

export const GuideSpine = styled.span<{ $x: number; $continues: boolean }>`
  position: absolute;
  left: ${({ $x }) => $x}px;
  top: 0;
  bottom: ${({ $continues }) => ($continues ? '0' : '50%')};
  width: 1px;
  background: ${({ theme }) => theme.colors.neutral300};
  pointer-events: none;
`;

export const GuideHorizontal = styled.span<{ $x: number }>`
  position: absolute;
  left: ${({ $x }) => $x}px;
  top: 50%;
  width: 10px;
  height: 1px;
  background: ${({ theme }) => theme.colors.neutral300};
  pointer-events: none;
`;

// ─── Directory row internals ──────────────────────────────────────────────────

export const ExpandButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  margin: -4px;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.neutral300};
  flex-shrink: 0;
  z-index: 1;
  border-radius: 4px;

  &:hover {
    background: ${({ theme }) => theme.colors.neutral100};
  }
`;

export const DirName = styled.span`
  font-weight: 600;
  font-size: 14px;
  line-height: 1.4;
  color: ${({ theme }) => theme.colors.neutral800};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  z-index: 1;
`;

export const DirCount = styled.span`
  font-size: 10px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.neutral500};
  background: ${({ theme }) => theme.colors.neutral150};
  border-radius: 20px;
  padding: 2px 8px;
  flex-shrink: 0;
  z-index: 1;
`;

// ─── File row internals ───────────────────────────────────────────────────────

export const ExpandSpacer = styled.span`
  width: 21px;
  flex-shrink: 0;
  display: inline-block;
`;

export const MissingBadge = styled.span`
  font-size: 10px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.danger600};
  background: ${({ theme }) => theme.colors.danger100};
  border: 1px solid ${({ theme }) => theme.colors.danger200};
  border-radius: 4px;
  padding: 1px 6px;
  flex-shrink: 0;
  z-index: 1;
  white-space: nowrap;
`;

export const FileNameOverflow = styled.div`
  min-width: 0;
  flex: 0 1 auto;
  max-width: 100%;
  z-index: 1;
`;

export const FileNameLink = styled.a`
  font-size: 14px;
  font-weight: 500;
  line-height: 1.4;
  color: ${({ theme }) => theme.colors.neutral800};
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-decoration: none;
  vertical-align: bottom;

  &:hover {
    text-decoration: underline;
  }
`;

export const HashChip = styled.span`
  font-family: ui-monospace, monospace;
  font-size: 11px;
  color: ${({ theme }) => theme.colors.neutral600};
  background: ${({ theme }) => theme.colors.neutral100};
  border: 1px solid ${({ theme }) => theme.colors.neutral150};
  border-radius: 4px;
  padding: 3px 7px;
  cursor: pointer;
  display: inline-block;
  max-width: 100%;
`;

// ─── Download-once toggle ─────────────────────────────────────────────────────

export const ToggleButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
`;

export const ToggleTrack = styled.span<{ $active: boolean }>`
  display: inline-block;
  position: relative;
  width: 40px;
  height: 22px;
  border-radius: 11px;
  flex-shrink: 0;
  background: ${({ theme, $active }) =>
    $active ? theme.colors.primary600 : theme.colors.neutral300};
  transition: background 0.2s;
`;

export const ToggleThumb = styled.span<{ $active: boolean }>`
  position: absolute;
  top: 3px;
  left: ${({ $active }) => ($active ? '21px' : '3px')};
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.neutral0};
  transition: left 0.2s;
`;

// ─── Context menu helpers ─────────────────────────────────────────────────────

export const MenuItemRow = styled.span`
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const DangerLabel = styled.span`
  color: #d02b20;
`;
