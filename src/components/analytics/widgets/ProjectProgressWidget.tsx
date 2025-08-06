import React, { useEffect, useState } from 'react';
import { List, Progress, Tag, Typography, Avatar, Space, Empty } from 'antd';
import { 
  ExclamationCircleOutlined, 
  CheckCircleOutlined, 
  ClockCircleOutlined,
  WarningOutlined
} from '@ant-design/icons';
import { WidgetConfig, ProjectProgressData } from '@/types/analytics';
import { useAnalytics } from '@/hooks/useAnalytics';

const { Text, Paragraph } = Typography;

interface ProjectProgressWidgetProps {
  config: WidgetConfig;
  refreshKey: number;
  onLoading: (loading: boolean) => void;
  onError: (error: string | null) => void;
}

export const ProjectProgressWidget: React.FC<ProjectProgressWidgetProps> = ({
  config,
  refreshKey,
  onLoading,
  onError
}) => {
  const { getDashboardData } = useAnalytics();
  const [data, setData] = useState<ProjectProgressData[]>([]);

  useEffect(() => {
    loadData();
  }, [refreshKey]);

  const loadData = async () => {
    try {
      onLoading(true);
      onError(null);
      
      const response = await getDashboardData({
        timeRange: config.filters?.timeRange || 'month',
        projectIds: config.filters?.projectIds
      });
      
      setData(response.projectProgress || []);
    } catch (error) {
      console.error('加载项目进度数据失败:', error);
      onError(error instanceof Error ? error.message : '加载数据失败');
    } finally {
      onLoading(false);
    }
  };

  // 获取状态配置
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'on_track':
        return {
          icon: <CheckCircleOutlined />,
          color: '#52c41a',
          text: '正常',
          tag: 'success'
        };
      case 'at_risk':
        return {
          icon: <ExclamationCircleOutlined />,
          color: '#faad14',
          text: '风险',
          tag: 'warning'
        };
      case 'delayed':
        return {
          icon: <WarningOutlined />,
          color: '#ff4d4f',
          text: '延期',
          tag: 'error'
        };
      default:
        return {
          icon: <ClockCircleOutlined />,
          color: '#d9d9d9',
          text: '未知',
          tag: 'default'
        };
    }
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    if (!dateString) return '未设定';
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric'
    });
  };

  if (!data || data.length === 0) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="暂无项目数据"
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

  const displayMode = config.settings?.displayMode || 'list';
  const showRiskIndicators = config.settings?.showRiskIndicators !== false;

  return (
    <div className="project-progress-widget" style={{ height: '100%', overflow: 'auto' }}>
      <List
       
        dataSource={data}
        renderItem={(project) => {
          const statusConfig = getStatusConfig(project.status);
          
          return (
            <List.Item
              key={project.projectId}
              style={{ 
                padding: displayMode === 'compact' ? '8px 0' : '12px 0',
                borderBottom: '1px solid #f0f0f0'
              }}
            >
              <div style={{ width: '100%' }}>
                {/* 项目标题行 */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
                    <Avatar
                     
                      style={{ 
                        backgroundColor: project.color || '#1890ff',
                        marginRight: '8px',
                        flexShrink: 0
                      }}
                    >
                      {project.projectName.charAt(0)}
                    </Avatar>
                    
                    <Text 
                      strong 
                      style={{ 
                        fontSize: displayMode === 'compact' ? '12px' : '14px',
                        flex: 1,
                        minWidth: 0
                      }}
                      ellipsis={{ tooltip: project.projectName }}
                    >
                      {project.projectName}
                    </Text>
                  </div>

                  <Space>
                    {showRiskIndicators && (
                      <Tag 
                        color={statusConfig.tag} 
                        icon={statusConfig.icon}
                        style={{ fontSize: '11px', margin: 0 }}
                      >
                        {statusConfig.text}
                      </Tag>
                    )}
                    
                    <Text 
                      style={{ 
                        fontSize: '12px', 
                        color: '#666',
                        fontWeight: 'bold'
                      }}
                    >
                      {project.progress}%
                    </Text>
                  </Space>
                </div>

                {/* 进度条 */}
                <div style={{ marginBottom: displayMode === 'compact' ? '4px' : '8px' }}>
                  <Progress
                    percent={project.progress}
                   
                    strokeColor={project.color || statusConfig.color}
                    showInfo={false}
                    trailColor="#f5f5f5"
                  />
                </div>

                {/* 详细信息 */}
                {displayMode !== 'compact' && (
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    fontSize: '11px',
                    color: '#999'
                  }}>
                    <span>
                      剩余任务: {project.remainingTasks}
                    </span>
                    <span>
                      预计完成: {formatDate(project.estimatedCompletion)}
                    </span>
                  </div>
                )}
              </div>
            </List.Item>
          );
        }}
      />
    </div>
  );
};