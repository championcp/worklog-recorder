import React, { useEffect, useState, useCallback } from 'react';
import { List, Avatar, Typography, Tag, Empty, Tooltip } from 'antd';
import { WidgetConfig, ActivityData } from '@/types/analytics';
import { useAnalytics } from '@/hooks/useAnalytics';
import { 
  PlusOutlined, 
  CheckCircleOutlined, 
  ClockCircleOutlined,
  UserAddOutlined,
  EditOutlined 
} from '@ant-design/icons';

const { Text } = Typography;

interface ActivityFeedWidgetProps {
  config: WidgetConfig;
  refreshKey: number;
  onLoading: (loading: boolean) => void;
  onError: (error: string | null) => void;
}

export const ActivityFeedWidget: React.FC<ActivityFeedWidgetProps> = ({
  config,
  refreshKey,
  onLoading,
  onError
}) => {
  const { getDashboardData } = useAnalytics();
  const [data, setData] = useState<ActivityData[]>([]);

  const loadData = useCallback(async () => {
    try {
      onLoading(true);
      onError(null);
      
      const response = await getDashboardData({
        timeRange: config.filters?.timeRange || 'week',
        projectIds: config.filters?.projectIds
      });
      
      const activities = response.recentActivity || [];
      const maxItems = config.filters?.maxItems || 20;
      setData(activities.slice(0, maxItems));
    } catch (error) {
      console.error('加载活动数据失败:', error);
      onError(error instanceof Error ? error.message : '加载数据失败');
    } finally {
      onLoading(false);
    }
  }, [getDashboardData, config.filters?.timeRange, config.filters?.projectIds, config.filters?.maxItems, onLoading, onError]);

  useEffect(() => {
    loadData();
  }, [loadData, refreshKey]);

  // 获取活动图标
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'task_created':
        return <PlusOutlined style={{ color: '#1890ff' }} />;
      case 'task_completed':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'time_logged':
        return <ClockCircleOutlined style={{ color: '#faad14' }} />;
      case 'member_joined':
        return <UserAddOutlined style={{ color: '#722ed1' }} />;
      default:
        return <EditOutlined style={{ color: '#666' }} />;
    }
  };

  // 获取活动类型标签
  const getActivityTag = (type: string) => {
    const tagMap: Record<string, { color: string; text: string }> = {
      task_created: { color: 'blue', text: '任务' },
      task_completed: { color: 'green', text: '完成' },
      time_logged: { color: 'orange', text: '时间' },
      member_joined: { color: 'purple', text: '成员' },
    };
    return tagMap[type] || { color: 'default', text: '其他' };
  };

  // 格式化时间
  const formatTime = (timestamp: string) => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffMs = now.getTime() - activityTime.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 60) {
      return `${diffMinutes}分钟前`;
    } else if (diffHours < 24) {
      return `${diffHours}小时前`;
    } else if (diffDays < 30) {
      return `${diffDays}天前`;
    } else {
      return activityTime.toLocaleDateString('zh-CN');
    }
  };

  if (!data || data.length === 0) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="暂无活动记录"
        style={{ 
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%'
        }}
      />
    );
  }

  return (
    <div className="activity-feed-widget" style={{ height: '100%', overflow: 'auto' }}>
      <List
       
        dataSource={data}
        renderItem={(activity) => {
          const activityTag = getActivityTag(activity.type);
          
          return (
            <List.Item
              key={activity.id}
              style={{ 
                padding: '8px 0',
                borderBottom: '1px solid #f5f5f5'
              }}
            >
              <List.Item.Meta
                avatar={
                  <Avatar 
                    
                    src={activity.avatar}
                    style={{ 
                      backgroundColor: !activity.avatar ? '#1890ff' : undefined 
                    }}
                  >
                    {!activity.avatar && activity.username?.charAt(0)?.toUpperCase()}
                  </Avatar>
                }
                title={
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '13px'
                  }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {getActivityIcon(activity.type)}
                      <Text strong>{activity.username}</Text>
                    </span>
                    <Tag 
                      color={activityTag.color}
                     
                      style={{ fontSize: '10px', margin: 0 }}
                    >
                      {activityTag.text}
                    </Tag>
                  </div>
                }
                description={
                  <div style={{ fontSize: '12px' }}>
                    <div style={{ marginBottom: '4px' }}>
                      <Text>{activity.title}</Text>
                    </div>
                    
                    {activity.description && (
                      <Tooltip title={activity.description}>
                        <Text 
                          type="secondary" 
                          ellipsis
                          style={{ fontSize: '11px' }}
                        >
                          {activity.description}
                        </Text>
                      </Tooltip>
                    )}
                    
                    <div style={{ 
                      marginTop: '4px',
                      fontSize: '10px',
                      color: '#999'
                    }}>
                      {formatTime(activity.timestamp)}
                    </div>
                  </div>
                }
              />
            </List.Item>
          );
        }}
      />
    </div>
  );
};