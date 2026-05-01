import styled from 'styled-components';

export const StatsBarRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 24px;
`;

export const StatCard = styled.div`
  flex: 1 1 0;
  min-width: 140px;
  background: ${({ theme }) => theme.colors.neutral0};
  border-radius: ${({ theme }) => theme.borderRadius};
  border: 1px solid ${({ theme }) => theme.colors.neutral200};
  padding: 20px;
`;

export const StatLabel = styled.div`
  margin-bottom: 8px;
`;
