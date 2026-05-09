import styled from 'styled-components';

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
