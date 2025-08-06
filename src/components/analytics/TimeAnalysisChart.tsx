import React, { useEffect, useState, useMemo } from 'react';
import { Card, Select, DatePicker, Row, Col, Typography, Statistic, Alert, Space } from 'antd';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { CalendarHeatmap } from 'react-calendar-heatmap';
import { TimeAnalysisData, TrendPoint, HeatmapPoint } from '@/types/analytics';
import { useAnalytics } from '@/hooks/useAnalytics';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

interface TimeAnalysisChartProps {
  projectId?: number;
  className?: string;
}

export const TimeAnalysisChart: React.FC<TimeAnalysisChartProps> = ({
  projectId,
  className
}) => {
  const { getTimeAnalysisData, loading, error } = useAnalytics();
  const [data, setData] = useState<TimeAnalysisData | null>(null);
  const [analysisType, setAnalysisType] = useState<'trend' | 'heatmap' | 'distribution'>('trend');
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'custom'>('month');
  const [customRange, setCustomRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);

  useEffect(() => {
    loadAnalysisData();
  }, [analysisType, timeRange, customRange, projectId]);

  const loadAnalysisData = async () => {
    try {
      const params = {
        type: analysisType,
        timeRange,
        projectId,
        ...(timeRange === 'custom' && customRange && {
          startDate: customRange[0].toISOString(),
          endDate: customRange[1].toISOString()
        })
      };

      const result = await getTimeAnalysisData(params);
      setData(result);
    } catch (err) {
      console.error('加载时间分析数据失败:', err);
    }
  };

  // 处理趋势图数据
  const trendChartData = useMemo(() => {
    if (!data?.trendData) return [];
    
    return data.trendData.map(point => ({
      ...point,
      date: dayjs(point.date).format('MM/DD'),
      效率: point.efficiency,
      工作时长: point.hours,
      任务数: point.tasks
    }));
  }, [data?.trendData]);

  // 处理热力图数据
  const heatmapData = useMemo(() => {
    if (!data?.heatmapData) return [];
    
    return data.heatmapData.map(point => ({
      date: point.date,
      count: point.value, // react-calendar-heatmap 需要 count 字段
      value: point.value,
      hour: point.hour,
      taskCount: point.taskCount
    }));
  }, [data?.heatmapData]);

  // 渲染趋势图
  const renderTrendChart = () => {
    if (!trendChartData.length) {
      return <div style={{ textAlign: 'center', padding: '40px' }}>暂无数据</div>;
    }

    return (
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={trendChartData}>
          <defs>
            <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#1890ff" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#1890ff" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorEfficiency" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#52c41a" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#52c41a" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="date" 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: '#666' }}
          />
          <YAxis 
            yAxisId="hours"
            orientation="left"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: '#666' }}
          />
          <YAxis 
            yAxisId="efficiency"
            orientation="right"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: '#666' }}
            domain={[0, 100]}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #d9d9d9',
              borderRadius: '4px',
              fontSize: '12px'
            }}
            formatter={(value, name) => [
              typeof value === 'number' ? value.toFixed(1) : value,
              name
            ]}
          />
          <Legend />
          <Area
            yAxisId="hours"
            type="monotone"
            dataKey="工作时长"
            stroke="#1890ff"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorHours)"
          />
          <Line
            yAxisId="efficiency"
            type="monotone"
            dataKey="效率"
            stroke="#52c41a"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    );
  };

  // 渲染热力图
  const renderHeatmap = () => {
    if (!heatmapData.length) {
      return <div style={{ textAlign: 'center', padding: '40px' }}>暂无数据</div>;
    }

    const startDate = dayjs().subtract(3, 'month').toDate();
    const endDate = dayjs().toDate();

    return (
      <div style={{ padding: '20px 0' }}>
        <CalendarHeatmap
          startDate={startDate}
          endDate={endDate}
          values={heatmapData}
          classForValue={(value) => {
            if (!value || value.count === 0) {
              return 'color-empty';
            }
            if (value.count < 60) return 'color-scale-1';
            if (value.count < 120) return 'color-scale-2';
            if (value.count < 180) return 'color-scale-3';
            return 'color-scale-4';
          }}
          tooltipDataAttrs={(value) => {
            if (!value || !value.date) {
              return { 'data-tip': '暂无数据' };
            }
            return {
              'data-tip': `${dayjs(value.date).format('YYYY-MM-DD')}: ${
                value.count || 0
              }分钟工作时间，${value.taskCount || 0}个任务`
            };
          }}
        />
        
        <style>{`
          .react-calendar-heatmap .color-empty {
            fill: #ebedf0;
          }
          .react-calendar-heatmap .color-scale-1 {
            fill: #c6e48b;
          }
          .react-calendar-heatmap .color-scale-2 {
            fill: #7bc96f;
          }
          .react-calendar-heatmap .color-scale-3 {
            fill: #239a3b;
          }
          .react-calendar-heatmap .color-scale-4 {
            fill: #196127;
          }
          .react-calendar-heatmap text {
            font-size: 10px;
            fill: #767676;
          }
        `}</style>
      </div>
    );
  };

  // 渲染洞察统计
  const renderInsights = () => {
    if (!data?.insights) return null;

    const { insights } = data;

    return (
      <Row gutter={16} style={{ marginTop: '16px' }}>
        <Col span={6}>
          <Statistic
            title="总工作时长"
            value={insights.totalHours}
            suffix="小时"
            precision={1}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="日均时长"
            value={insights.averageDailyHours}
            suffix="小时"
            precision={1}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="效率评分"
            value={insights.efficiencyScore}
            suffix="分"
            valueStyle={{ color: insights.efficiencyScore >= 80 ? '#52c41a' : '#faad14' }}
          />
        </Col>
        <Col span={6}>
          <div>
            <div style={{ fontSize: '14px', color: '#999', marginBottom: '4px' }}>
              高效时段
            </div>
            <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
              {insights.peakHours.slice(0, 2).join(', ')}
            </div>
          </div>
        </Col>
      </Row>
    );
  };

  if (error) {
    return (
      <Alert
        message="数据加载失败"
        description={error}
        type="error"
        showIcon
      />
    );
  }

  return (
    <Card
      className={className}
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={4} style={{ margin: 0 }}>
            时间分析
          </Title>
          
          <Space>
            <Select
              value={analysisType}
              onChange={setAnalysisType}
              style={{ width: 120 }}
            >
              <Option value="trend">趋势分析</Option>
              <Option value="heatmap">热力图</Option>
              <Option value="distribution">分布图</Option>
            </Select>
            
            <Select
              value={timeRange}
              onChange={setTimeRange}
              style={{ width: 120 }}
            >
              <Option value="week">近一周</Option>
              <Option value="month">近一月</Option>
              <Option value="quarter">近三月</Option>
              <Option value="custom">自定义</Option>
            </Select>
            
            {timeRange === 'custom' && (
              <RangePicker
                value={customRange}
                onChange={setCustomRange}
                size="small"
              />
            )}
          </Space>
        </div>
      }
      loading={loading}
    >
      <div style={{ minHeight: '400px' }}>
        {analysisType === 'trend' && renderTrendChart()}
        {analysisType === 'heatmap' && renderHeatmap()}
        {analysisType === 'distribution' && (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            分布图功能开发中
          </div>
        )}
        
        {renderInsights()}
        
        {data?.insights?.recommendations && data.insights.recommendations.length > 0 && (
          <div style={{ marginTop: '20px' }}>
            <Title level={5}>改进建议</Title>
            <ul style={{ color: '#666', fontSize: '13px' }}>
              {data.insights.recommendations.map((rec, index) => (
                <li key={index} style={{ marginBottom: '4px' }}>
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Card>
  );
};