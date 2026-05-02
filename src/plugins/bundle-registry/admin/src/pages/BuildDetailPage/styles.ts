import styled, { keyframes } from 'styled-components';

// ─── Loading bar ──────────────────────────────────────────────────────────────

export const LoadingBarAnimation = keyframes`
  0%   { left: -60%; }
  100% { left: 110%; }
`;

export const LoadingBarContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  z-index: 9999;
  background: ${({ theme }) => theme.colors.neutral200};
  overflow: hidden;
`;

export const LoadingBarFill = styled.div`
  position: absolute;
  top: 0;
  height: 100%;
  width: 60%;
  background: ${({ theme }) => theme.colors.primary600};
  animation: ${LoadingBarAnimation} 1.2s linear infinite;
`;

// ─── Hidden file input ────────────────────────────────────────────────────────

export const HiddenInput = styled.input`
  display: none;
`;

// ─── Manifest URL panel ───────────────────────────────────────────────────────

export const ManifestFlexGrow = styled.div`
  flex: 1;
  min-width: 0;
`;

export const MonoUrl = styled.span`
  font-family: ui-monospace, monospace;
  word-break: break-all;
`;

export const CopyButtonWrap = styled.div`
  flex-shrink: 0;
  margin-top: 2px;
`;

// ─── File manager panel ───────────────────────────────────────────────────────

export const TablePanel = styled.div`
  background: ${({ theme }) => theme.colors.neutral0};
  border-radius: ${({ theme }) => theme.borderRadius};
  overflow: hidden;
  border: 1px solid ${({ theme }) => theme.colors.neutral200};
`;

export const FilesToolbar = styled.div`
  background: ${({ theme }) => theme.colors.neutral100};
  padding: 12px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.neutral200};
`;

export const ToolbarInner = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
`;

export const ToolbarLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
`;

export const CounterBox = styled.div`
  flex-shrink: 0;
`;

export const NoWrapP = styled.p`
  margin: 0;
  white-space: nowrap;
`;

export const ZeroMarginP = styled.p`
  margin: 0;
`;

export const SelectionPill = styled.div`
  padding: 3px 10px;
  border: 1px solid ${({ theme }) => theme.colors.primary200};
  border-radius: ${({ theme }) => theme.borderRadius};
  background: ${({ theme }) => theme.colors.primary100};
  flex-shrink: 0;
`;

export const ToolbarActions = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  flex-shrink: 0;
`;

// ─── Empty state ──────────────────────────────────────────────────────────────

export const EmptyStateBox = styled.div`
  padding: 32px;
  background: ${({ theme }) => theme.colors.neutral0};
  text-align: center;
`;

// ─── Search ───────────────────────────────────────────────────────────────────

export const SearchWrapper = styled.div`
  position: relative;
  flex: 1 1 0;
  max-width: 320px;
  min-width: 80px;
`;

export const SearchIcon = styled.span`
  position: absolute;
  left: 9px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  display: flex;
  color: ${({ theme }) => theme.colors.neutral400};
`;

export const SearchInput = styled.input<{ hasClear: boolean }>`
  width: 100%;
  height: 32px;
  box-sizing: border-box;
  padding-left: 30px;
  padding-right: ${({ hasClear }) => (hasClear ? '28px' : '10px')};
  border: 1px solid ${({ theme }) => theme.colors.neutral200};
  border-radius: 4px;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.neutral800};
  background: ${({ theme }) => theme.colors.neutral0};
  outline: none;
  font-family: inherit;
`;

export const SearchClearButton = styled.button`
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.neutral400};
  font-size: 18px;
  line-height: 1;
  padding: 0;
`;
