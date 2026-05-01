import styled from 'styled-components';

export const BadgePill = styled.div<{ $bg: string }>`
  display: inline-flex;
  padding: 3px 10px;
  border-radius: ${({ theme }) => theme.borderRadius};
  background: ${({ theme, $bg }) => theme.colors[$bg] ?? $bg};
`;
