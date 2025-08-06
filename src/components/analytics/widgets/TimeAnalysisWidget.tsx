import React, { useEffect, useState } from 'react';
import { Select, Space, Alert } from 'antd';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { WidgetConfig, TimeAnalysisData } from '@/types/analytics';
import { useAnalytics } from '@/hooks/useAnalytics';
import dayjs from 'dayjs';

const { Option } = Select;

interface TimeAnalysisWidgetProps {
  config: WidgetConfig;
  refreshKey: number;
  onLoading: (loading: boolean) => void;
  onError: (error: string | null) => void;
}

export const TimeAnalysisWidget: React.FC<TimeAnalysisWidgetProps> = ({
  config,
  refreshKey,
  onLoading,
  onError
}) => {
  const { getTimeAnalysisData } = useAnalytics();
  const [data, setData] = useState<TimeAnalysisData | null>(null);
  const [chartType, setChartType] = useState<'line' | 'area'>('area');

  useEffect(() => {
    loadData();
  }, [refreshKey]);

  const loadData = async () => {
    try {
      onLoading(true);
      onError(null);
      
      const result = await getTimeAnalysisData({
        type: 'trend',
        timeRange: config.filters?.timeRange || 'month',
        projectId: config.filters?.projectIds?.[0]
      });
      
      setData(result);
    } catch (error) {
      console.error('加载时间分析数据失败:', error);
      onError(error instanceof Error ? error.message : '加载数据失败');
    } finally {
      onLoading(false);
    }
  };

  // 处理图表数据
  const chartData = data?.trendData?.map(point => ({
    date: dayjs(point.date).format('MM/DD'),
    hours: point.hours,
    tasks: point.tasks,
    efficiency: point.efficiency
  })) || [];

  const renderChart = () => {
    if (!chartData.length) {
      return (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '200px',
          color: '#999'
        }}>
          暂无数据
        </div>
      );
    }

    const ChartComponent = chartType === 'area' ? AreaChart : LineChart;
    const DataComponent = chartType === 'area' ? Area : Line;

    return (
      <ResponsiveContainer width="100%" height={200}>
        <ChartComponent data={chartData}>
          <defs>
            {chartType === 'area' && (
              <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1890ff" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#1890ff" stopOpacity={0}/>
              </linearGradient>
            )}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
          <XAxis 
            dataKey="date" 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: '#999' }}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: '#999' }}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e8e8e8',
              borderRadius: '4px',
              fontSize: '11px'
            }}
            formatter={(value: any, name: string) => [
              `${parseFloat(value).toFixed(1)}${name === 'hours' ? '小时' : name === 'tasks' ? '个' : '%'}`,
              name === 'hours' ? '工作时长' : name === 'tasks' ? '任务数' : '效率'
            ]}
          />
          <DataComponent
            type="monotone"
            dataKey="hours"
            stroke="#1890ff"
            strokeWidth={2}
            {...(chartType === 'area' ? {
              fillOpacity: 1,
              fill: "url(#colorHours)"
            } : {
              dot: { r: 2 }
            })}
          />
        </ChartComponent>
      </ResponsiveContainer>
    );
  };

  return (
    <div style={{ height: '100%', padding: '8px 0' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '12px'
      }}>
        <div style={{ fontSize: '12px', color: '#999' }}>
          {config.filters?.timeRange || '月度'} 时间趋势
        </div>
        
        <Select
          value={chartType}
          onChange={setChartType}
          size="small"
          style={{ width: 80 }}
        >
          <Option value="area">面积</Option>
          <Option value="line">折线</Option>
        </Select>
      </div>
      
      <div style={{ flex: 1 }}>
        {renderChart()}
      </div>
      
      {data?.insights && (
        <div style={{ 
          marginTop: '8px',
          display: 'flex',
          justifyContent: 'space-around',
          fontSize: '11px',
          color: '#666'
        }}>
          <div>
            <div>总时长</div>
            <div style={{ fontWeight: 'bold', color: '#1890ff' }}>
              {data.insights.totalHours.toFixed(1)}h
            </div>
          </div>
          <div>
            <div>日均</div>
            <div style={{ fontWeight: 'bold', color: '#52c41a' }}>
              {data.insights.averageDailyHours.toFixed(1)}h
            </div>
          </div>
          <div>
            <div>效率</div>
            <div style={{ fontWeight: 'bold', color: '#faad14' }}>
              {data.insights.efficiencyScore}%
            </div>
          </div>
        </div>
      )}
    </div>
  );
};