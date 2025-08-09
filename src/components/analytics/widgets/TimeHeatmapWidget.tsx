import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Empty, Tooltip, Select, Typography, Space, Spin, Card } from 'antd';
import CalendarHeatmap from 'react-calendar-heatmap';
import { WidgetConfig } from '@/types/analytics';
import dayjs from 'dayjs';
import 'react-calendar-heatmap/dist/styles.css';

const { Option } = Select;
const { Text } = Typography;

interface TimeHeatmapWidgetProps {
  config: WidgetConfig;
  refreshKey: number;
  onLoading: (loading: boolean) => void;
  onError: (error: string | null) => void;
}

interface HeatmapData {
  date: string;
  count: number;
  value: number;
  details: {
    totalMinutes: number;
    taskCount: number;
    projects: string[];
    mostActiveHour: number;
  };
}

interface TimeRange {
  label: string;
  days: number;
  startDate: dayjs.Dayjs;
  endDate: dayjs.Dayjs;
}

const TIME_RANGES: TimeRange[] = [
  {
    label: '最近30天',
    days: 30,
    startDate: dayjs().subtract(30, 'day'),
    endDate: dayjs()
  },
  {
    label: '最近90天',
    days: 90,
    startDate: dayjs().subtract(90, 'day'),
    endDate: dayjs()
  },
  {
    label: '最近半年',
    days: 180,
    startDate: dayjs().subtract(180, 'day'),
    endDate: dayjs()
  },
  {
    label: '最近一年',
    days: 365,
    startDate: dayjs().subtract(365, 'day'),
    endDate: dayjs()
  }
];

export const TimeHeatmapWidget: React.FC<TimeHeatmapWidgetProps> = ({
  config,
  refreshKey,
  onLoading,
  onError
}) => {
  const [data, setData] = useState<HeatmapData[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange>(TIME_RANGES[0]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<HeatmapData | null>(null);

  // 加载热力图数据
  const loadHeatmapData = useCallback(async () => {
    try {
      setLoading(true);
      onLoading(true);
      onError(null);

      // 调用真实的API
      const response = await fetch(`/api/analytics/time-analysis?type=heatmap&timeRange=custom&startDate=${timeRange.startDate.toISOString()}&endDate=${timeRange.endDate.toISOString()}`, {
        method: 'GET',
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
        throw new Error(result.error || '获取数据失败');
      }

      // 转换API数据为组件所需格式
      const heatmapData: HeatmapData[] = [];
      const currentDate = timeRange.startDate.clone();
      
      // 创建日期到数据的映射
      const dataMap = new Map<string, any>();
      if (result.data.heatmapData) {
        result.data.heatmapData.forEach((item: any) => {
          const dateKey = dayjs(item.date).format('YYYY-MM-DD');
          if (!dataMap.has(dateKey)) {
            dataMap.set(dateKey, {
              totalMinutes: 0,
              taskCount: 0,
              hours: new Set<number>(),
              projects: new Set<string>()
            });
          }
          const dayData = dataMap.get(dateKey);
          dayData.totalMinutes += item.value;
          dayData.taskCount += item.taskCount;
          dayData.hours.add(item.hour);
        });
      }
      
      // 填充所有日期数据
      while (currentDate.isBefore(timeRange.endDate) || currentDate.isSame(timeRange.endDate, 'day')) {
        const dateKey = currentDate.format('YYYY-MM-DD');
        const dayData = dataMap.get(dateKey);
        
        if (dayData) {
          const hoursArray = Array.from(dayData.hours);
          heatmapData.push({
            date: dateKey,
            count: dayData.totalMinutes,
            value: Math.min(Math.floor(dayData.totalMinutes / 60), 10),
            details: {
              totalMinutes: dayData.totalMinutes,
              taskCount: dayData.taskCount,
              projects: Array.from(dayData.projects).slice(0, 3) as string[],
              mostActiveHour: hoursArray.length > 0 ? Number(hoursArray[Math.floor(hoursArray.length / 2)]) : 9
            }
          });
        } else {
          // 没有数据的日期
          heatmapData.push({
            date: dateKey,
            count: 0,
            value: 0,
            details: {
              totalMinutes: 0,
              taskCount: 0,
              projects: [],
              mostActiveHour: 0
            }
          });
        }
        
        currentDate.add(1, 'day');
      }

      setData(heatmapData);
    } catch (error) {
      console.error('加载热力图数据失败:', error);
      onError(`加载热力图数据失败: ${error instanceof Error ? error.message : '未知错误'}`);
      
      // 在出错时提供空数据而不是完全失败
      setData([]);
    } finally {
      setLoading(false);
      onLoading(false);
    }
  }, [timeRange, onLoading, onError]);

  useEffect(() => {
    loadHeatmapData();
  }, [loadHeatmapData, refreshKey]);

  // 计算统计信息
  const statistics = useMemo(() => {
    if (data.length === 0) return null;

    const totalMinutes = data.reduce((sum, item) => sum + item.details.totalMinutes, 0);
    const totalTasks = data.reduce((sum, item) => sum + item.details.taskCount, 0);
    const activeDays = data.filter(item => item.count > 0).length;
    const maxDay = data.reduce((max, item) => item.count > max.count ? item : max, data[0]);
    const avgDaily = Math.round(totalMinutes / data.length);
    
    return {
      totalHours: Math.round(totalMinutes / 60),
      totalTasks,
      activeDays,
      totalDays: data.length,
      avgDailyMinutes: avgDaily,
      maxDay: {
        date: dayjs(maxDay.date).format('MM月DD日'),
        minutes: maxDay.details.totalMinutes
      },
      consistency: Math.round((activeDays / data.length) * 100)
    };
  }, [data]);

  // 获取热力图颜色级别
  const getClassForValue = (value: any) => {
    if (!value || value.count === 0) {
      return 'color-empty';
    }
    if (value.value <= 2) return 'color-scale-1';
    if (value.value <= 4) return 'color-scale-2';
    if (value.value <= 6) return 'color-scale-3';
    return 'color-scale-4';
  };

  // 渲染工具提示内容
  const getTooltipContent = (value: any) => {
    if (!value || value.count === 0) {
      return `${dayjs(value?.date).format('YYYY年MM月DD日')}: 无工作记录`;
    }

    const hours = Math.floor(value.details.totalMinutes / 60);
    const minutes = value.details.totalMinutes % 60;
    const timeStr = hours > 0 ? `${hours}小时${minutes}分钟` : `${minutes}分钟`;

    return `${dayjs(value.date).format('YYYY年MM月DD日')}\n工作时长: ${timeStr}\n完成任务: ${value.details.taskCount}个\n涉及项目: ${value.details.projects.join(', ')}\n最活跃时段: ${value.details.mostActiveHour}:00`;
  };

  if (loading && data.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100%' 
      }}>
        <Empty 
          description="暂无工作时间数据"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </div>
    );
  }

  return (
    <div style={{ height: '100%', padding: '16px', overflow: 'auto' }}>
      {/* 控制面板 */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '16px' 
      }}>
        <Space>
          <Text strong>时间范围:</Text>
          <Select
            value={timeRange.label}
            onChange={(value) => {
              const selected = TIME_RANGES.find(range => range.label === value);
              if (selected) setTimeRange(selected);
            }}
            style={{ width: 120 }}
            size="small"
          >
            {TIME_RANGES.map(range => (
              <Option key={range.label} value={range.label}>
                {range.label}
              </Option>
            ))}
          </Select>
        </Space>
        
        {statistics && (
          <div style={{ fontSize: '12px', color: '#666' }}>
            活跃天数: {statistics.activeDays}/{statistics.totalDays} 
            ({statistics.consistency}%)
          </div>
        )}
      </div>

      {/* 热力图 */}
      <div style={{ marginBottom: '16px' }}>
        <CalendarHeatmap
          startDate={timeRange.startDate.toDate()}
          endDate={timeRange.endDate.toDate()}
          values={data}
          classForValue={getClassForValue}
          titleForValue={getTooltipContent}
          onClick={(value: any) => setSelectedDate(value as HeatmapData)}
          showWeekdayLabels
          horizontal
        />
      </div>

      {/* 图例 */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        gap: '8px',
        marginBottom: '16px',
        fontSize: '12px'
      }}>
        <span>少</span>
        <div className="color-scale-legend">
          <div className="color-empty"></div>
          <div className="color-scale-1"></div>
          <div className="color-scale-2"></div>
          <div className="color-scale-3"></div>
          <div className="color-scale-4"></div>
        </div>
        <span>多</span>
      </div>

      {/* 统计信息卡片 */}
      {statistics && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px'
        }}>
          <Card size="small" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>
              {statistics.totalHours}h
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>总工作时长</div>
          </Card>
          
          <Card size="small" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>
              {statistics.totalTasks}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>完成任务数</div>
          </Card>
          
          <Card size="small" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#722ed1' }}>
              {statistics.avgDailyMinutes}min
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>日均工作时长</div>
          </Card>
          
          <Card size="small" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#fa8c16' }}>
              {statistics.maxDay.date}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              最忙碌日 ({Math.round(statistics.maxDay.minutes/60)}h)
            </div>
          </Card>
        </div>
      )}

      {/* 选中日期详情 */}
      {selectedDate && (
        <Card 
          size="small" 
          title={`${dayjs(selectedDate.date).format('YYYY年MM月DD日')} 工作详情`}
          style={{ marginTop: '16px' }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <Text type="secondary">工作时长:</Text>
              <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                {Math.floor(selectedDate.details.totalMinutes / 60)}小时
                {selectedDate.details.totalMinutes % 60}分钟
              </div>
            </div>
            <div>
              <Text type="secondary">完成任务:</Text>
              <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                {selectedDate.details.taskCount}个
              </div>
            </div>
            <div>
              <Text type="secondary">涉及项目:</Text>
              <div>{selectedDate.details.projects.join(', ')}</div>
            </div>
            <div>
              <Text type="secondary">最活跃时段:</Text>
              <div>{selectedDate.details.mostActiveHour}:00 - {selectedDate.details.mostActiveHour + 1}:00</div>
            </div>
          </div>
        </Card>
      )}

      {/* CSS样式 */}
      <style jsx>{`
        .color-scale-legend {
          display: flex;
          gap: 2px;
        }
        .color-scale-legend > div {
          width: 12px;
          height: 12px;
          border-radius: 2px;
        }
        .color-empty {
          background-color: #ebedf0;
        }
        .color-scale-1 {
          background-color: #c6e48b;
        }
        .color-scale-2 {
          background-color: #7bc96f;
        }
        .color-scale-3 {
          background-color: #239a3b;
        }
        .color-scale-4 {
          background-color: #196127;
        }
      `}</style>
    </div>
  );
};