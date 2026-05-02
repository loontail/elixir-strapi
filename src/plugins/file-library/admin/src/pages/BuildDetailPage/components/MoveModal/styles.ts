import styled from 'styled-components';

export const DirList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 320px;
  overflow-y: auto;
  margin-top: 8px;
`;

export const DirItem = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 12px;
  border: 1px solid
    ${({ theme, $active }) => ($active ? theme.colors.primary600 : theme.colors.neutral200)};
  border-radius: ${({ theme }) => theme.borderRadius};
  background: ${({ theme, $active }) =>
    $active ? theme.colors.primary100 : theme.colors.neutral0};
  cursor: pointer;
  text-align: left;
  font-size: 13px;
  font-family: ui-monospace, monospace;
  color: ${({ theme, $active }) =>
    $active ? theme.colors.primary700 : theme.colors.neutral700};
  transition:
    background 0.1s,
    border-color 0.1s;

  &:hover {
    background: ${({ theme, $active }) =>
      $active ? theme.colors.primary100 : theme.colors.neutral100};
    border-color: ${({ theme, $active }) =>
      $active ? theme.colors.primary600 : theme.colors.neutral300};
  }
`;

export const MovingLabel = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.neutral500};
  margin-bottom: 16px;
  padding: 8px 12px;
  background: ${({ theme }) => theme.colors.neutral100};
  border-radius: ${({ theme }) => theme.borderRadius};
  font-family: ui-monospace, monospace;
`;
