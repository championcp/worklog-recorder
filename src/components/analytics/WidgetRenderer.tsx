import React, { useEffect, useState } from 'react';
import { Spin, Alert, Empty } from 'antd';
import { WidgetConfig } from '@/types/analytics';
import { OverviewWidget } from './widgets/OverviewWidget';
import { ProjectProgressWidget } from './widgets/ProjectProgressWidget';
import { TimeAnalysisWidget } from './widgets/TimeAnalysisWidget';
import { TaskSummaryWidget } from './widgets/TaskSummaryWidget';
import { ActivityFeedWidget } from './widgets/ActivityFeedWidget';
import { TimeHeatmapWidget } from './widgets/TimeHeatmapWidget';
import { EfficiencyChartWidget } from './widgets/EfficiencyChartWidget';
import { WorkloadDistributionWidget } from './widgets/WorkloadDistributionWidget';

interface WidgetRendererProps {
  config: WidgetConfig;
  className?: string;
  style?: React.CSSProperties;
}

export const WidgetRenderer: React.FC<WidgetRendererProps> = ({
  config,
  className,
  style
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // 自动刷新逻辑
  useEffect(() => {
    if (!config.refresh || config.refresh <= 0) return;

    const interval = setInterval(() => {
      setRefreshKey(prev => prev + 1);
    }, config.refresh * 1000);

    return () => clearInterval(interval);
  }, [config.refresh]);

  // 渲染对应的小部件
  const renderWidget = () => {
    try {
      const commonProps = {
        config,
        refreshKey,
        onLoading: setLoading,
        onError: setError
      };

      switch (config.type) {
        case 'overview':
          return <OverviewWidget {...commonProps} />;
          
        case 'project_progress':
          return <ProjectProgressWidget {...commonProps} />;
          
        case 'time_analysis':
          return <TimeAnalysisWidget {...commonProps} />;
          
        case 'task_summary':
          return <TaskSummaryWidget {...commonProps} />;
          
        case 'activity_feed':
          return <ActivityFeedWidget {...commonProps} />;
          
        case 'time_heatmap':
          return <TimeHeatmapWidget {...commonProps} />;
          
        case 'efficiency_chart':
          return <EfficiencyChartWidget {...commonProps} />;
          
        case 'workload_distribution':
          return <WorkloadDistributionWidget {...commonProps} />;
          
        default:
          return (
            <Empty 
              description={`未知的小部件类型: ${config.type}`}
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          );
      }
    } catch (err) {
      console.error('Widget rendering error:', err);
      return (
        <Alert 
          message="渲染错误"
          description={`小部件渲染失败: ${err instanceof Error ? err.message : '未知错误'}`}
          type="error"
          showIcon
        />
      );
    }
  };

  // 如果有错误，显示错误信息
  if (error) {
    return (
      <Alert
        message="数据加载失败"
        description={error}
        type="error"
        showIcon
        style={{ margin: '16px' }}
      />
    );
  }

  return (
    <div 
      className={`widget-renderer ${className || ''}`}
      style={{ 
        height: '100%',
        position: 'relative',
        ...style 
      }}
    >
      <Spin 
        spinning={loading} 
        tip="加载数据中..."
        style={{
          maxHeight: 'none'
        }}
      >
        <div style={{ height: '100%', overflow: 'hidden' }}>
          {renderWidget()}
        </div>
      </Spin>
    </div>
  );
};