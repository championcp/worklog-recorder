import React from 'react';
import { Empty } from 'antd';
import { WidgetConfig } from '@/types/analytics';

interface TaskSummaryWidgetProps {
  config: WidgetConfig;
  refreshKey: number;
  onLoading: (loading: boolean) => void;
  onError: (error: string | null) => void;
}

export const TaskSummaryWidget: React.FC<TaskSummaryWidgetProps> = () => {
  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100%' 
    }}>
      <Empty 
        description="任务汇总小部件 - 开发中"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    </div>
  );
};