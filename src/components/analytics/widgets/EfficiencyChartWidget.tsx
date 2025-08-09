import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, Row, Col, Select, Spin, Alert, Typography, Progress, Tag, Divider, Statistic, Tooltip } from 'antd';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { TrophyOutlined, RiseOutlined, ClockCircleOutlined, CalendarOutlined, AlertOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { WidgetConfig } from '@/types/analytics';
import dayjs from 'dayjs';

const { Option } = Select;
const { Text, Title } = Typography;

interface EfficiencyChartWidgetProps {
  config: WidgetConfig;
  refreshKey: number;
  onLoading: (loading: boolean) => void;
  onError: (error: string | null) => void;
}

interface EfficiencyData {
  // 效率趋势数据
  trendData: {
    date: string;
    efficiency: number;
    planned: number;
    actual: number;
    completedTasks: number;
    averageTaskTime: number;
    consistency: number;
  }[];
  
  // 效率分析洞察
  insights: {
    overallScore: number;
    consistency: number;
    peakPeriods: string[];
    improvementAreas: string[];
    recommendations: string[];
    weekdayPattern: {
      day: string;
      dayName: string;
      efficiency: number;
      productivity: number;
    }[];
    hourlyPattern: {
      hour: number;
      efficiency: number;
      productivity: number;
      taskCount: number;
    }[];
  };
  
  // 项目效率对比
  projectEfficiency: {
    projectId: number;
    projectName: string;
    efficiency: number;
    tasksCompleted: number;
    avgTaskDuration: number;
    color: string;
  }[];

  // 效率等级分布
  efficiencyDistribution: {
    level: string;
    count: number;
    percentage: number;
  }[];
}

export const EfficiencyChartWidget: React.FC<EfficiencyChartWidgetProps> = ({
  config,
  refreshKey,
  onLoading,
  onError
}) => {
  const [data, setData] = useState<EfficiencyData | null>(null);
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('month');
  const [chartType, setChartType] = useState<'trend' | 'radar' | 'distribution'>('trend');

  // 生成模拟数据
  const generateMockData = useCallback((): EfficiencyData => {
    const days = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 90;
    const trendData = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = dayjs().subtract(i, 'day');
      const baseEfficiency = 75 + Math.random() * 20;
      const planned = 6 + Math.random() * 3;
      const actual = planned * (baseEfficiency / 100);
      
      trendData.push({
        date: date.format('YYYY-MM-DD'),
        efficiency: Math.round(baseEfficiency),
        planned: Math.round(planned * 10) / 10,
        actual: Math.round(actual * 10) / 10,
        completedTasks: Math.floor(actual / 0.8),
        averageTaskTime: 48 + Math.random() * 30,
        consistency: 60 + Math.random() * 30
      });
    }

    return {
      trendData,
      insights: {
        overallScore: 78,
        consistency: 72,
        peakPeriods: ['09:00-11:00', '14:00-16:00'],
        improvementAreas: ['任务预估准确性', '时间分配均衡性', '专注度保持'],
        recommendations: [
          '建议在9-11点处理复杂任务，此时段效率最高',
          '可尝试使用番茄钟工作法提升专注度',
          '建议改善任务时间预估方法，当前偏向乐观',
          '午后时段可安排相对简单的任务'
        ],
        weekdayPattern: [
          { day: '1', dayName: '周一', efficiency: 75, productivity: 85 },
          { day: '2', dayName: '周二', efficiency: 82, productivity: 88 },
          { day: '3', dayName: '周三', efficiency: 78, productivity: 90 },
          { day: '4', dayName: '周四', efficiency: 80, productivity: 85 },
          { day: '5', dayName: '周五', efficiency: 72, productivity: 78 },
          { day: '6', dayName: '周六', efficiency: 65, productivity: 70 },
          { day: '0', dayName: '周日', efficiency: 68, productivity: 72 }
        ],
        hourlyPattern: Array.from({ length: 24 }, (_, hour) => ({
          hour,
          efficiency: hour >= 9 && hour <= 17 ? 70 + Math.random() * 25 : 40 + Math.random() * 20,
          productivity: hour >= 9 && hour <= 17 ? 75 + Math.random() * 20 : 45 + Math.random() * 15,
          taskCount: hour >= 9 && hour <= 17 ? Math.floor(Math.random() * 5) : Math.floor(Math.random() * 2)
        }))
      },
      projectEfficiency: [
        { projectId: 1, projectName: '网站重构', efficiency: 85, tasksCompleted: 24, avgTaskDuration: 2.5, color: '#1890ff' },
        { projectId: 2, projectName: '移动应用', efficiency: 72, tasksCompleted: 18, avgTaskDuration: 3.2, color: '#52c41a' },
        { projectId: 3, projectName: '数据分析', efficiency: 78, tasksCompleted: 15, avgTaskDuration: 4.1, color: '#faad14' },
        { projectId: 4, projectName: '系统优化', efficiency: 81, tasksCompleted: 12, avgTaskDuration: 2.8, color: '#722ed1' }
      ],
      efficiencyDistribution: [
        { level: '优秀 (90-100%)', count: 8, percentage: 27 },
        { level: '良好 (75-89%)', count: 12, percentage: 40 },
        { level: '一般 (60-74%)', count: 7, percentage: 23 },
        { level: '待改进 (<60%)', count: 3, percentage: 10 }
      ]
    };
  }, [timeRange]);

  // 加载效率分析数据
  const loadEfficiencyData = useCallback(async () => {
    try {
      setLoading(true);
      onLoading(true);
      onError(null);

      const response = await fetch(`/api/analytics/efficiency?timeRange=${timeRange}&type=comprehensive`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP错误! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || '获取效率数据失败');
      }

      // 处理真实数据或生成模拟数据
      const processedData: EfficiencyData = result.data || generateMockData();
      setData(processedData);

    } catch (error) {
      console.error('加载效率数据失败:', error);
      onError(`加载效率数据失败: ${error instanceof Error ? error.message : '未知错误'}`);
      
      // 在出错时提供模拟数据
      setData(generateMockData());
    } finally {
      setLoading(false);
      onLoading(false);
    }
  }, [timeRange, onLoading, onError, generateMockData]);

  useEffect(() => {
    loadEfficiencyData();
  }, [loadEfficiencyData, refreshKey]);

  // 计算效率等级和颜色
  const getEfficiencyLevel = (score: number) => {
    if (score >= 90) return { level: '优秀', color: '#52c41a', icon: <CheckCircleOutlined /> };
    if (score >= 75) return { level: '良好', color: '#1890ff', icon: <TrophyOutlined /> };
    if (score >= 60) return { level: '一般', color: '#faad14', icon: <ClockCircleOutlined /> };
    return { level: '需改进', color: '#f5222d', icon: <AlertOutlined /> };
  };

  // 自定义图表工具提示
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip" style={{ 
          background: 'rgba(255, 255, 255, 0.95)', 
          border: '1px solid #f0f0f0',
          borderRadius: '6px',
          padding: '12px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
        }}>
          <p style={{ margin: 0, fontWeight: 'bold', color: '#262626' }}>
            {dayjs(label).format('MM月DD日 dddd')}
          </p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ 
              margin: '4px 0', 
              color: entry.color,
              fontSize: '13px'
            }}>
              <span style={{ fontWeight: 500 }}>{entry.name}:</span>{' '}
              {entry.value}
              {entry.dataKey === 'efficiency' && '%'}
              {(entry.dataKey === 'planned' || entry.dataKey === 'actual') && 'h'}
              {entry.dataKey === 'completedTasks' && '个'}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // 渲染趋势图
  const renderTrendChart = () => (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data?.trendData || []}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis 
          dataKey="date" 
          tickFormatter={(value) => dayjs(value).format('MM/DD')}
          tick={{ fontSize: 11 }}
          axisLine={{ stroke: '#d9d9d9' }}
        />
        <YAxis tick={{ fontSize: 11 }} axisLine={{ stroke: '#d9d9d9' }} />
        <RechartsTooltip content={<CustomTooltip />} />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="efficiency" 
          stroke="#1890ff" 
          strokeWidth={3}
          name="效率评分"
          dot={{ r: 4, strokeWidth: 2 }}
          activeDot={{ r: 6, strokeWidth: 2 }}
        />
        <Line 
          type="monotone" 
          dataKey="consistency" 
          stroke="#52c41a" 
          strokeWidth={2}
          strokeDasharray="5 5"
          name="一致性"
          dot={{ r: 3 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );

  // 渲染雷达图
  const renderRadarChart = () => (
    <ResponsiveContainer width="100%" height={280}>
      <RadarChart data={data?.insights.weekdayPattern || []}>
        <PolarGrid stroke="#f0f0f0" />
        <PolarAngleAxis dataKey="dayName" tick={{ fontSize: 11 }} />
        <PolarRadiusAxis 
          angle={90} 
          domain={[0, 100]} 
          tick={{ fontSize: 10 }} 
          axisLine={false}
        />
        <Radar
          name="效率"
          dataKey="efficiency"
          stroke="#1890ff"
          fill="#1890ff"
          fillOpacity={0.3}
          strokeWidth={2}
        />
        <Radar
          name="产出"
          dataKey="productivity"
          stroke="#52c41a"
          fill="#52c41a"
          fillOpacity={0.2}
          strokeWidth={2}
        />
        <Legend />
        <RechartsTooltip formatter={(value) => [`${value}%`, '']} />
      </RadarChart>
    </ResponsiveContainer>
  );

  // 渲染分布图
  const renderDistributionChart = () => (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data?.projectEfficiency || []} layout="horizontal">
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
        <YAxis 
          dataKey="projectName" 
          type="category" 
          width={80}
          tick={{ fontSize: 11 }}
          axisLine={{ stroke: '#d9d9d9' }}
        />
        <RechartsTooltip 
          formatter={(value, name) => [`${value}%`, '效率']}
          labelFormatter={(name) => `项目: ${name}`}
        />
        <Bar 
          dataKey="efficiency" 
          fill="#1890ff"
          radius={[0, 4, 4, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!data) {
    return (
      <Alert
        message="暂无效率数据"
        description="请确保已有足够的工作记录来进行效率分析"
        type="info"
        showIcon
      />
    );
  }

  const efficiencyLevel = getEfficiencyLevel(data.insights.overallScore);

  return (
    <div style={{ height: '100%', overflow: 'auto' }}>
      {/* 控制面板 */}
      <Row gutter={16} style={{ marginBottom: '16px' }}>
        <Col span={8}>
          <Select
            value={timeRange}
            onChange={setTimeRange}
            style={{ width: '100%' }}
            size="small"
          >
            <Option value="week">最近一周</Option>
            <Option value="month">最近一月</Option>
            <Option value="quarter">最近三月</Option>
          </Select>
        </Col>
        <Col span={8}>
          <Select
            value={chartType}
            onChange={setChartType}
            style={{ width: '100%' }}
            size="small"
          >
            <Option value="trend">趋势图</Option>
            <Option value="radar">雷达图</Option>
            <Option value="distribution">分布图</Option>
          </Select>
        </Col>
      </Row>

      {/* 效率概览 */}
      <Row gutter={12} style={{ marginBottom: '16px' }}>
        <Col span={6}>
          <Card size="small" style={{ textAlign: 'center', height: '90px' }}>
            <div style={{ color: efficiencyLevel.color, fontSize: '20px', marginBottom: '4px' }}>
              {efficiencyLevel.icon} {data.insights.overallScore}%
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              整体效率 · {efficiencyLevel.level}
            </div>
          </Card>
        </Col>
        
        <Col span={6}>
          <Card size="small" style={{ textAlign: 'center', height: '90px' }}>
            <div style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '4px' }}>
              {data.insights.consistency}%
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              工作一致性
            </div>
          </Card>
        </Col>
        
        <Col span={6}>
          <Card size="small" style={{ textAlign: 'center', height: '90px' }}>
            <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '4px' }}>
              {data.insights.peakPeriods.length}个
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              高效时段
            </div>
          </Card>
        </Col>
        
        <Col span={6}>
          <Card size="small" style={{ textAlign: 'center', height: '90px' }}>
            <div style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '4px' }}>
              {data.projectEfficiency.length}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              活跃项目
            </div>
          </Card>
        </Col>
      </Row>

      {/* 主图表区域 */}
      <Card size="small" style={{ marginBottom: '16px' }}>
        {chartType === 'trend' && renderTrendChart()}
        {chartType === 'radar' && renderRadarChart()}
        {chartType === 'distribution' && renderDistributionChart()}
      </Card>

      {/* 高效时段和建议 */}
      <Row gutter={12}>
        <Col span={12}>
          <Card title="高效时段" size="small" style={{ fontSize: '12px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {data.insights.peakPeriods.map((period, index) => (
                <Tag key={index} color="blue" style={{ fontSize: '11px' }}>
                  <ClockCircleOutlined style={{ marginRight: '2px' }} />
                  {period}
                </Tag>
              ))}
            </div>
            <Divider style={{ margin: '8px 0' }} />
            <div style={{ fontSize: '11px', color: '#666' }}>
              建议在这些时段处理重要或复杂的任务
            </div>
          </Card>
        </Col>
        
        <Col span={12}>
          <Card title="改进建议" size="small" style={{ fontSize: '12px' }}>
            <div style={{ maxHeight: '80px', overflow: 'auto' }}>
              {data.insights.recommendations.slice(0, 2).map((rec, index) => (
                <div key={index} style={{ 
                  fontSize: '11px', 
                  marginBottom: '4px',
                  padding: '2px 0',
                  color: '#595959'
                }}>
                  • {rec}
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};