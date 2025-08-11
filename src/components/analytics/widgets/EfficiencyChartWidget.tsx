import React from 'react';
import { Empty } from 'antd';
import { WidgetConfig } from '@/types/analytics';

interface EfficiencyChartWidgetProps {
  config: WidgetConfig;
  refreshKey: number;
  onLoading: (loading: boolean) => void;
  onError: (error: string | null) => void;
}

export const EfficiencyChartWidget: React.FC<EfficiencyChartWidgetProps> = () => {
  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100%' 
    }}>
      <Empty 
        description="效率趋势小部件 - 开发中"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    </div>
  );
};