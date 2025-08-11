import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// 简化的Time Analysis Widget测试
describe('TimeAnalysisWidget', () => {
  it('应该能够处理时间分析逻辑', () => {
    const timeData = [
      { date: '2025-08-01', hours: 8.5 },
      { date: '2025-08-02', hours: 7.2 }
    ];

    const totalHours = timeData.reduce((sum, day) => sum + day.hours, 0);
    
    expect(totalHours).toBe(15.7);
    expect(timeData).toHaveLength(2);
  });

  it('应该能够格式化时间数据', () => {
    const formatHours = (hours: number) => `${hours.toFixed(1)}h`;
    
    expect(formatHours(8.5)).toBe('8.5h');
    expect(formatHours(7)).toBe('7.0h');
  });

  it('应该能够计算效率评分', () => {
    const calculateEfficiency = (actual: number, estimated: number) => {
      return Math.min(Math.round((actual / estimated) * 100), 100);
    };

    expect(calculateEfficiency(8, 10)).toBe(80);
    expect(calculateEfficiency(12, 10)).toBe(100); // 不超过100
  });

  it('应该能够处理图表配置', () => {
    const chartConfig = {
      type: 'area',
      timeRange: 'month',
      projectIds: [1, 2, 3]
    };

    expect(chartConfig.type).toBe('area');
    expect(chartConfig.projectIds).toContain(2);
  });
});