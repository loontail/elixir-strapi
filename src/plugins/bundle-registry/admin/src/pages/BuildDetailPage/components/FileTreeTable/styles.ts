import styled from 'styled-components';

// Column layout constants — shared with FileTreeRow/styles.ts for consistent widths
export const COL = {
  check: { width: 48, minWidth: 48, paddingLeft: 16, paddingRight: 8, flexShrink: 0 as const },
  name: { flex: '1 1 0', minWidth: 180, overflow: 'hidden' as const },
  size: {
    width: 90,
    minWidth: 80,
    textAlign: 'right' as const,
    paddingRight: 16,
    flexShrink: 0 as const,
  },
  mod: { width: 140, minWidth: 120, paddingLeft: 16, flexShrink: 0 as const },
  hash: { width: 160, minWidth: 140, paddingLeft: 16, flexShrink: 0 as const },
  dl: { width: 120, minWidth: 100, paddingLeft: 12, flexShrink: 0 as const },
  act: { width: 48, minWidth: 48, textAlign: 'center' as const, flexShrink: 0 as const },
} as const;

export const TableRoot = styled.div`
  width: 100%;
`;


export const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  background: ${({ theme }) => theme.colors.neutral100};
  height: 36px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.neutral200};
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.neutral500};
`;

export const HeaderCheckCell = styled.div`
  width: 48px;
  min-width: 48px;
  padding-left: 16px;
  padding-right: 8px;
  flex-shrink: 0;
`;

export const HeaderNameCell = styled.div`
  flex: 1 1 0;
  min-width: 180px;
  overflow: hidden;
  padding-left: 8px;
`;

export const HeaderSizeCell = styled.div`
  width: 90px;
  min-width: 80px;
  text-align: right;
  padding-right: 16px;
  flex-shrink: 0;
`;

export const HeaderModCell = styled.div`
  width: 140px;
  min-width: 120px;
  padding-left: 16px;
  flex-shrink: 0;
`;

export const HeaderHashCell = styled.div`
  width: 160px;
  min-width: 140px;
  padding-left: 16px;
  flex-shrink: 0;
`;

export const HeaderDlCell = styled.div`
  width: 120px;
  min-width: 100px;
  padding-left: 12px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
`;

export const HeaderActCell = styled.div`
  width: 48px;
  min-width: 48px;
  flex-shrink: 0;
`;
