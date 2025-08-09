import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Spin, Alert, Empty, Button, Tooltip } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
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
  showRefreshButton?: boolean;
  onRefresh?: () => void;
}

export const WidgetRenderer: React.FC<WidgetRendererProps> = ({
  config,
  className,
  style,
  showRefreshButton = true,
  onRefresh
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // 手动刷新
  const handleManualRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
    setLastRefresh(new Date());
    onRefresh?.();
  }, [onRefresh]);

  // WebSocket连接管理
  useEffect(() => {
    // 如果启用了实时更新，建立WebSocket连接
    if (config.settings?.realtime) {
      try {
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${wsProtocol}//${window.location.host}/ws/dashboard/${config.type}`;
        
        wsRef.current = new WebSocket(wsUrl);
        
        wsRef.current.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'data_update' && data.widgetType === config.type) {
              handleManualRefresh();
            }
          } catch (err) {
            console.warn('WebSocket消息解析失败:', err);
          }
        };

        wsRef.current.onerror = (error) => {
          console.warn('WebSocket连接错误:', error);
        };

        wsRef.current.onclose = () => {
          console.info('WebSocket连接已关闭');
        };
      } catch (err) {
        console.warn('WebSocket初始化失败:', err);
      }
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [config.type, config.settings?.realtime, handleManualRefresh]);

  // 自动刷新逻辑
  useEffect(() => {
    // 清理之前的定时器
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // 如果启用了实时更新，不使用定时器
    if (config.settings?.realtime) return;
    
    // 如果刷新间隔无效，不设置定时器
    if (!config.refresh || config.refresh <= 0) return;

    // 智能刷新：根据页面可见性调整刷新频率
    const getRefreshInterval = () => {
      const refreshInterval = config.refresh || 300; // 默认5分钟
      if (document.hidden) {
        // 页面不可见时降低刷新频率
        return Math.max(refreshInterval * 5, 60); // 最少1分钟
      }
      return refreshInterval;
    };

    const startInterval = () => {
      const interval = getRefreshInterval() * 1000;
      intervalRef.current = setInterval(() => {
        handleManualRefresh();
      }, interval);
    };

    startInterval();

    // 监听页面可见性变化
    const handleVisibilityChange = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      startInterval();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [config.refresh, config.settings?.realtime, handleManualRefresh]);

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

  // 格式化最后刷新时间
  const formatLastRefresh = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}小时前`;
    const days = Math.floor(hours / 24);
    return `${days}天前`;
  };

  // 渲染刷新按钮和状态
  const renderRefreshControl = () => {
    if (!showRefreshButton) return null;

    return (
      <div style={{
        position: 'absolute',
        top: '8px',
        right: '8px',
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(4px)',
        borderRadius: '4px',
        padding: '2px 8px',
        fontSize: '12px',
        color: '#666'
      }}>
        <span>更新: {formatLastRefresh(lastRefresh)}</span>
        <Tooltip title="手动刷新数据">
          <Button
            type="text"
            size="small"
            icon={<ReloadOutlined />}
            loading={loading}
            onClick={handleManualRefresh}
            style={{ 
              border: 'none',
              boxShadow: 'none',
              minWidth: 'auto',
              padding: '0 4px'
            }}
          />
        </Tooltip>
        {config.settings?.realtime && (
          <Tooltip title="实时数据">
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: wsRef.current?.readyState === WebSocket.OPEN ? '#52c41a' : '#ff4d4f'
            }} />
          </Tooltip>
        )}
      </div>
    );
  };

  // 如果有错误，显示错误信息
  if (error) {
    return (
      <div style={{ position: 'relative', height: '100%' }}>
        {renderRefreshControl()}
        <Alert
          message="数据加载失败"
          description={error}
          type="error"
          showIcon
          style={{ margin: '16px' }}
        />
      </div>
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
      {renderRefreshControl()}
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