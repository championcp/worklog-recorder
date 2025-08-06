import React, { useEffect, useState } from 'react';
import { Row, Col, Statistic, Card, Progress, Typography } from 'antd';
import { 
  ProjectOutlined, 
  CheckCircleOutlined, 
  ClockCircleOutlined, 
  TrophyOutlined 
} from '@ant-design/icons';
import { WidgetConfig } from '@/types/analytics';
import { useAnalytics } from '@/hooks/useAnalytics';

const { Text } = Typography;

interface OverviewWidgetProps {
  config: WidgetConfig;
  refreshKey: number;
  onLoading: (loading: boolean) => void;
  onError: (error: string | null) => void;
}

export const OverviewWidget: React.FC<OverviewWidgetProps> = ({
  config,
  refreshKey,
  onLoading,
  onError
}) => {
  const { getDashboardData } = useAnalytics();
  const [data, setData] = useState<any>(null);

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
      
      setData(response.overview);
    } catch (error) {
      console.error('加载概览数据失败:', error);
      onError(error instanceof Error ? error.message : '加载数据失败');
    } finally {
      onLoading(false);
    }
  };

  if (!data) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>暂无数据</div>;
  }

  // 计算效率等级和颜色
  const getEfficiencyLevel = (score: number) => {
    if (score >= 90) return { level: '优秀', color: '#52c41a' };
    if (score >= 80) return { level: '良好', color: '#1890ff' };
    if (score >= 70) return { level: '一般', color: '#faad14' };
    return { level: '需改进', color: '#ff4d4f' };
  };

  const efficiency = getEfficiencyLevel(data.efficiencyScore);

  return (
    <div className="overview-widget">
      <Row gutter={[16, 16]} style={{ height: '100%' }}>
        <Col xs={12} sm={12} md={6} lg={6}>
          <Card style={{ height: '100%' }}>
            <Statistic
              title="项目总数"
              value={data.totalProjects}
              prefix={<ProjectOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
            <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
              <Text type="secondary">
                活跃: {data.activeProjects}
              </Text>
            </div>
          </Card>
        </Col>

        <Col xs={12} sm={12} md={6} lg={6}>
          <Card style={{ height: '100%' }}>
            <Statistic
              title="完成任务"
              value={data.completedTasks}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>

        <Col xs={12} sm={12} md={6} lg={6}>
          <Card style={{ height: '100%' }}>
            <Statistic
              title="工作时长"
              value={data.totalHours}
              suffix="小时"
              prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
              precision={1}
            />
          </Card>
        </Col>

        <Col xs={12} sm={12} md={6} lg={6}>
          <Card style={{ height: '100%' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                fontSize: '14px', 
                color: '#666', 
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px'
              }}>
                <TrophyOutlined style={{ color: efficiency.color }} />
                效率评分
              </div>
              
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <Progress
                  type="circle"
                  percent={data.efficiencyScore}
                  size={60}
                  strokeColor={efficiency.color}
                  format={(percent) => (
                    <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
                      {percent}
                    </span>
                  )}
                />
              </div>
              
              <div style={{ 
                fontSize: '12px', 
                color: efficiency.color, 
                marginTop: '4px',
                fontWeight: 'bold'
              }}>
                {efficiency.level}
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};