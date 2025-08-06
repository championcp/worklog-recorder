import React, { useEffect, useState } from 'react';
import { Card, Select, Row, Col, Statistic, Progress, Typography } from 'antd';
import { 
  RadialBarChart, 
  RadialBar, 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import { TrophyOutlined, RiseOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { TimeDistributionData } from '@/types/analytics';
import { useAnalytics } from '@/hooks/useAnalytics';

const { Title, Text } = Typography;
const { Option } = Select;

interface EfficiencyVisualizationProps {
  projectId?: number;
  timeRange?: string;
}

export const EfficiencyVisualization: React.FC<EfficiencyVisualizationProps> = ({
  projectId,
  timeRange = 'month'
}) => {
  const { getDashboardData } = useAnalytics();
  const [data, setData] = useState<{
    timeDistribution: TimeDistributionData[];
    efficiency: number;
    totalHours: number;
    completedTasks: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [chartType, setChartType] = useState<'radial' | 'pie' | 'bar'>('pie');

  useEffect(() => {
    loadData();
  }, [projectId, timeRange]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const response = await getDashboardData({
        timeRange: timeRange as any,
        projectIds: projectId ? [projectId] : undefined
      });
      
      setData({
        timeDistribution: response.timeDistribution,
        efficiency: response.overview.efficiencyScore,
        totalHours: response.overview.totalHours,
        completedTasks: response.overview.completedTasks
      });
    } catch (error) {
      console.error('加载效率数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 为饼图准备颜色
  const COLORS = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2', '#eb2f96'];

  // 渲染径向条形图
  const renderRadialChart = () => {
    if (!data?.timeDistribution) return null;

    const radialData = data.timeDistribution.map((item, index) => ({
      name: item.projectName,
      value: item.percentage,
      fill: COLORS[index % COLORS.length]
    }));

    return (
      <ResponsiveContainer width="100%" height={300}>
        <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="90%" data={radialData}>
          <RadialBar dataKey="value" cornerRadius={2} fill="#8884d8" />
          <Tooltip 
            formatter={(value) => [`${value}%`, '占比']}
            labelFormatter={(name) => `项目: ${name}`}
          />
        </RadialBarChart>
      </ResponsiveContainer>
    );
  };

  // 渲染饼图
  const renderPieChart = () => {
    if (!data?.timeDistribution) return null;

    const pieData = data.timeDistribution.map((item, index) => ({
      name: item.projectName,
      value: item.hours,
      percentage: item.percentage
    }));

    return (
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={120}
            paddingAngle={2}
            dataKey="value"
          >
            {pieData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value, name) => [
              `${parseFloat(value as string).toFixed(1)}小时`, 
              `${name}`
            ]}
            labelFormatter={(name) => `项目: ${name}`}
          />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  // 渲染柱状图
  const renderBarChart = () => {
    if (!data?.timeDistribution) return null;

    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data.timeDistribution} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
          <XAxis 
            dataKey="projectName"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: '#666' }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: '#666' }}
          />
          <Tooltip 
            formatter={(value, name) => [`${value}小时`, '工作时长']}
            labelFormatter={(name) => `项目: ${name}`}
          />
          <Bar dataKey="hours" fill="#1890ff" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const renderChart = () => {
    switch (chartType) {
      case 'radial':
        return renderRadialChart();
      case 'pie':
        return renderPieChart();
      case 'bar':
        return renderBarChart();
      default:
        return renderPieChart();
    }
  };

  const getEfficiencyColor = (score: number) => {
    if (score >= 90) return '#52c41a';
    if (score >= 80) return '#1890ff';
    if (score >= 70) return '#faad14';
    return '#ff4d4f';
  };

  const getEfficiencyLevel = (score: number) => {
    if (score >= 90) return '优秀';
    if (score >= 80) return '良好';
    if (score >= 70) return '一般';
    return '需改进';
  };

  return (
    <Card
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={4} style={{ margin: 0 }}>
            <TrophyOutlined style={{ marginRight: '8px', color: '#faad14' }} />
            效率分析
          </Title>
          
          <Select
            value={chartType}
            onChange={setChartType}
            style={{ width: 120 }}
           
          >
            <Option value="pie">饼图</Option>
            <Option value="bar">柱状图</Option>
            <Option value="radial">径向图</Option>
          </Select>
        </div>
      }
      loading={loading}
    >
      <Row gutter={24}>
        <Col xs={24} md={16}>
          <div style={{ minHeight: '300px' }}>
            {data?.timeDistribution && data.timeDistribution.length > 0 ? (
              renderChart()
            ) : (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '300px',
                color: '#999'
              }}>
                暂无时间分布数据
              </div>
            )}
          </div>
        </Col>
        
        <Col xs={24} md={8}>
          <div style={{ padding: '20px 0' }}>
            {/* 效率评分 */}
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <Progress
                type="circle"
                percent={data?.efficiency || 0}
                size={100}
                strokeColor={getEfficiencyColor(data?.efficiency || 0)}
                format={(percent) => (
                  <div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                      {percent}
                    </div>
                    <div style={{ fontSize: '11px', color: '#666' }}>
                      效率评分
                    </div>
                  </div>
                )}
              />
              <div style={{ 
                marginTop: '8px', 
                color: getEfficiencyColor(data?.efficiency || 0),
                fontWeight: 'bold',
                fontSize: '14px'
              }}>
                {getEfficiencyLevel(data?.efficiency || 0)}
              </div>
            </div>

            {/* 统计数据 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Statistic
                title={
                  <span>
                    <ClockCircleOutlined style={{ marginRight: '4px' }} />
                    总工作时长
                  </span>
                }
                value={data?.totalHours || 0}
                suffix="小时"
                precision={1}
                valueStyle={{ fontSize: '16px' }}
              />
              
              <Statistic
                title={
                  <span>
                    <RiseOutlined style={{ marginRight: '4px' }} />
                    完成任务数
                  </span>
                }
                value={data?.completedTasks || 0}
                suffix="个"
                valueStyle={{ fontSize: '16px' }}
              />
              
              {data?.timeDistribution && (
                <div>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    最活跃项目
                  </Text>
                  <div style={{ marginTop: '4px' }}>
                    <Text strong style={{ fontSize: '14px' }}>
                      {data.timeDistribution[0]?.projectName || '暂无'}
                    </Text>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {data.timeDistribution[0]?.hours.toFixed(1)}小时 
                      ({data.timeDistribution[0]?.percentage}%)
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Col>
      </Row>
      
      {/* 项目列表 */}
      {data?.timeDistribution && data.timeDistribution.length > 0 && (
        <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #f0f0f0' }}>
          <Title level={5}>项目时间分布</Title>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            {data.timeDistribution.map((item, index) => (
              <div
                key={item.projectId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  backgroundColor: '#fafafa',
                  borderRadius: '6px',
                  fontSize: '12px'
                }}
              >
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: COLORS[index % COLORS.length]
                  }}
                />
                <span>{item.projectName}</span>
                <span style={{ color: '#999' }}>
                  {item.hours.toFixed(1)}h ({item.percentage}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};