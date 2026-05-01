import styled from 'styled-components';

export const DropZone = styled.div<{ $dragging: boolean; $filled: boolean }>`
  border: 2px dashed
    ${({ theme, $dragging, $filled }) =>
      $dragging ? theme.colors.primary500 : $filled ? theme.colors.success500 : theme.colors.neutral300};
  border-radius: 8px;
  padding: 28px 24px;
  text-align: center;
  cursor: pointer;
  background: ${({ theme, $dragging, $filled }) =>
    $dragging ? theme.colors.primary100 : $filled ? theme.colors.success100 : theme.colors.neutral100};
  transition:
    border-color 0.15s,
    background 0.15s;
  user-select: none;
`;

export const DropZoneIconRow = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 10px;
`;

export const DropZoneFileName = styled.p`
  margin: 0 0 4px;
`;

export const DropZoneFileSize = styled.p`
  margin: 0 0 10px;
`;

export const MonoHint = styled.p`
  margin: 6px 0 0;
  font-family: ui-monospace, monospace;
`;

export const DropZonePrompt = styled.p`
  margin: 0 0 4px;
`;

export const HiddenFileInput = styled.input`
  display: none;
`;
