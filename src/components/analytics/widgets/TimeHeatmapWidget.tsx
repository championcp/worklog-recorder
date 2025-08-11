import React from 'react';
import { Empty } from 'antd';
import { WidgetConfig } from '@/types/analytics';

interface TimeHeatmapWidgetProps {
  config: WidgetConfig;
  refreshKey: number;
  onLoading: (loading: boolean) => void;
  onError: (error: string | null) => void;
}

export const TimeHeatmapWidget: React.FC<TimeHeatmapWidgetProps> = () => {
  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100%' 
    }}>
      <Empty 
        description="工作热力图小部件 - 开发中"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    </div>
  );
};