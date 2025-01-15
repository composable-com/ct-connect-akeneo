import React from 'react';
import { BarChart3, Clock, Files, RefreshCw } from 'lucide-react';
import Card from '@commercetools-uikit/card';
import Text from '@commercetools-uikit/text';
import Grid from '@commercetools-uikit/grid';
import Spacings from '@commercetools-uikit/spacings';
import styled from '@emotion/styled';

interface StatsCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  trend?: string;
}

const IconWrapper = styled.div`
  padding: 8px;
  border-radius: 8px;
  background-color: #eef2ff;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const TrendBadge = styled.span`
  padding: 2px 8px;
  border-radius: 9999px;
  background-color: #d1fae5;
  color: #059669;
  font-size: 12px;
  font-weight: 500;
`;

function StatsCard({ icon, label, value, trend }: StatsCardProps) {
  return (
    <Card>
      <Spacings.Inline alignItems="center" scale="m">
        <IconWrapper>{icon}</IconWrapper>
        <div>
          <Text.Detail tone="secondary">{label}</Text.Detail>
          <Spacings.Inline scale="xs" alignItems="center">
            <Text.Headline as="h3">{value}</Text.Headline>
            {trend && <TrendBadge>{trend}</TrendBadge>}
          </Spacings.Inline>
        </div>
      </Spacings.Inline>
    </Card>
  );
}

export default function SyncStats() {
  return (
    <Grid gridGap="16px" gridTemplateColumns="repeat(4, 1fr)">
      <Grid.Item>
        <StatsCard
          icon={<RefreshCw size={20} color="#4F46E5" />}
          label="Total Syncs"
          value="1,284"
          trend="+12.5%"
        />
      </Grid.Item>
      <Grid.Item>
        <StatsCard
          icon={<Clock size={20} color="#4F46E5" />}
          label="Avg. Sync Time"
          value="1.2m"
        />
      </Grid.Item>
      <Grid.Item>
        <StatsCard
          icon={<Files size={20} color="#4F46E5" />}
          label="Items Synced"
          value="842,245"
        />
      </Grid.Item>
      <Grid.Item>
        <StatsCard
          icon={<BarChart3 size={20} color="#4F46E5" />}
          label="Success Rate"
          value="99.9%"
        />
      </Grid.Item>
    </Grid>
  );
}
