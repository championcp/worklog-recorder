import { AnalyticsService } from '@/lib/services/AnalyticsService';

// Mock database client
const mockDb = {
  prepare: jest.fn(() => ({
    get: jest.fn(),
    all: jest.fn()
  })),
  get: jest.fn(),
  all: jest.fn()
};

describe('AnalyticsService', () => {
  let analyticsService: AnalyticsService;

  beforeEach(() => {
    jest.clearAllMocks();
    analyticsService = new AnalyticsService(mockDb as any);
  });

  describe('getDashboardData', () => {
    it('应该正确获取仪表板数据', async () => {
      // Mock prepared statements
      const mockGet = jest.fn();
      const mockAll = jest.fn();
      
      mockDb.prepare.mockReturnValue({
        get: mockGet,
        all: mockAll
      });

      // Mock 数据库返回值
      mockGet
        .mockReturnValueOnce({ total_projects: 5, active_projects: 3 }) // 项目统计
        .mockReturnValueOnce({ completed_tasks: 25, total_tasks: 40 })   // 任务统计
        .mockReturnValueOnce({ total_hours: 120.5 })                     // 时间统计
        .mockReturnValueOnce({ avg_efficiency: 85 });                   // 效率评分

      mockAll
        .mockReturnValueOnce([                                           // 项目进度数据
          {
            project_id: 1,
            project_name: '项目A',
            color: '#1890ff',
            total_tasks: 10,
            completed_tasks: 7,
            overdue_tasks: 1,
            latest_end: '2025-08-20T00:00:00Z'
          }
        ])
        .mockReturnValueOnce([                                           // 最近活动
          {
            type: 'task_created',
            title: '创建了任务 "测试任务"',
            description: '测试描述',
            timestamp: '2025-08-06T10:00:00Z',
            user_id: 1,
            username: '张三',
            avatar_url: null
          }
        ])
        .mockReturnValueOnce([                                           // 时间分布
          {
            project_id: 1,
            project_name: '项目A',
            color: '#1890ff',
            hours: 45.5
          }
        ]);

      const result = await analyticsService.getDashboardData({
        userId: 1,
        timeRange: 'month'
      });

      expect(result.overview).toEqual({
        totalProjects: 5,
        activeProjects: 3,
        completedTasks: 25,
        totalHours: 120.5,
        efficiencyScore: 85
      });

      expect(result.projectProgress).toHaveLength(1);
      expect(result.projectProgress[0]).toEqual({
        projectId: 1,
        projectName: '项目A',
        progress: 70, // 7/10 * 100
        status: 'delayed', // 因为有overdue_tasks
        remainingTasks: 3, // 10 - 7
        estimatedCompletion: '2025-08-20T00:00:00Z',
        color: '#1890ff'
      });

      expect(result.recentActivity).toHaveLength(1);
      expect(result.timeDistribution).toHaveLength(1);
    });

    it('应该正确处理项目ID筛选', async () => {
      const mockGet = jest.fn();
      const mockAll = jest.fn();
      
      mockDb.prepare.mockReturnValue({
        get: mockGet,
        all: mockAll
      });
      
      mockGet.mockReturnValue({ total_projects: 2, active_projects: 1 });
      mockAll.mockReturnValue([]);

      await analyticsService.getDashboardData({
        userId: 1,
        timeRange: 'month',
        projectIds: [1, 2]
      });

      // 验证prepare方法被正确调用
      expect(mockDb.prepare).toHaveBeenCalled();
    });

    it('应该正确处理时间范围', async () => {
      const mockGet = jest.fn();
      const mockAll = jest.fn();
      
      mockDb.prepare.mockReturnValue({
        get: mockGet,
        all: mockAll
      });
      
      mockGet.mockReturnValue({});
      mockAll.mockReturnValue([]);

      await analyticsService.getDashboardData({
        userId: 1,
        timeRange: 'week'
      });

      // 验证prepare方法被正确调用
      expect(mockDb.prepare).toHaveBeenCalled();
    });
  });

  describe('getTimeAnalysisData', () => {
    it('应该正确获取趋势数据', async () => {
      const mockTrendData = [
        {
          date: '2025-08-01',
          hours: 8.5,
          tasks: 5,
          efficiency: 85
        }
      ];

      const mockGet = jest.fn();
      const mockAll = jest.fn();
      
      mockDb.prepare.mockReturnValue({
        get: mockGet,
        all: mockAll
      });

      mockAll.mockReturnValueOnce(mockTrendData);    // 趋势数据
      mockGet
        .mockReturnValueOnce({ hours: 40.5 })     // 总工作时长
        .mockReturnValueOnce({ days: 5 })         // 工作天数
        .mockReturnValueOnce({ day_name: 'Tuesday', total_seconds: 7200 }) // 最高效工作日
        .mockReturnValueOnce({ avg_efficiency: 85 }); // 效率评分
      mockAll.mockReturnValueOnce([              // 高峰时段数据
        { hour: '09:00', total_seconds: 3600 },
        { hour: '14:00', total_seconds: 3000 },
        { hour: '16:00', total_seconds: 2700 }
      ]);

      const result = await analyticsService.getTimeAnalysisData({
        userId: 1,
        type: 'trend',
        timeRange: 'month'
      });

      expect(result.type).toBe('trend');
      expect(result.trendData).toHaveLength(1);
      expect(result.trendData![0]).toEqual({
        date: '2025-08-01',
        hours: 8.5,
        tasks: 5,
        efficiency: 85
      });
    });

    it('应该正确获取热力图数据', async () => {
      const mockHeatmapData = [
        {
          date: '2025-08-01',
          hour: 14,
          minutes: 120,
          task_count: 3
        }
      ];

      const mockGet = jest.fn();
      const mockAll = jest.fn();
      
      mockDb.prepare.mockReturnValue({
        get: mockGet,
        all: mockAll
      });

      mockAll.mockReturnValueOnce(mockHeatmapData);
      mockGet
        .mockReturnValueOnce({ hours: 35.2 })     // 总工作时长
        .mockReturnValueOnce({ days: 4 })         // 工作天数
        .mockReturnValueOnce({ day_name: 'Wednesday', total_seconds: 8100 }) // 最高效工作日
        .mockReturnValueOnce({ avg_efficiency: 78 }); // 效率评分
      mockAll.mockReturnValueOnce([              // 高峰时段数据
        { hour: '10:00', total_seconds: 2800 },
        { hour: '15:00', total_seconds: 2400 }
      ]);

      const result = await analyticsService.getTimeAnalysisData({
        userId: 1,
        type: 'heatmap',
        timeRange: 'month'
      });

      expect(result.type).toBe('heatmap');
      expect(result.heatmapData).toHaveLength(1);
      expect(result.heatmapData![0]).toEqual({
        date: '2025-08-01',
        hour: 14,
        value: 120,
        taskCount: 3
      });
    });
  });

  describe('calculateEfficiencyScore', () => {
    it('应该正确计算效率评分', async () => {
      const mockGet = jest.fn();
      
      mockDb.prepare.mockReturnValue({
        get: mockGet,
        all: jest.fn()
      });
      
      mockGet.mockReturnValue({ avg_efficiency: 87.5 });

      const score = await (analyticsService as any).calculateEfficiencyScore(
        1, '2025-08-01', '2025-08-31', '', []
      );

      expect(score).toBe(88); // Math.round(87.5)
      expect(mockDb.prepare).toHaveBeenCalledWith(
        expect.stringContaining('AVG(CASE')
      );
    });

    it('效率评分应该不超过100', async () => {
      const mockGet = jest.fn();
      
      mockDb.prepare.mockReturnValue({
        get: mockGet,
        all: jest.fn()
      });
      
      mockGet.mockReturnValue({ avg_efficiency: 120 });

      const score = await (analyticsService as any).calculateEfficiencyScore(
        1, '2025-08-01', '2025-08-31', '', []
      );

      expect(score).toBe(100);
    });

    it('没有数据时应该返回默认值', async () => {
      const mockGet = jest.fn();
      
      mockDb.prepare.mockReturnValue({
        get: mockGet,
        all: jest.fn()
      });
      
      mockGet.mockReturnValue({ avg_efficiency: null });

      const score = await (analyticsService as any).calculateEfficiencyScore(
        1, '2025-08-01', '2025-08-31', '', []
      );

      expect(score).toBe(75); // 默认值
    });
  });

  describe('generateRecommendations', () => {
    it('应该为低效率生成建议', () => {
      const recommendations = (analyticsService as any).generateRecommendations(
        50, 8, 2 // 低效率，正常工时，正常高峰时段
      );

      expect(recommendations).toContain('考虑重新评估任务的时间预估，可能过于乐观');
    });

    it('应该为长工时生成建议', () => {
      const recommendations = (analyticsService as any).generateRecommendations(
        80, 12, 3 // 正常效率，长工时，正常高峰时段
      );

      expect(recommendations).toContain('工作时间较长，建议适当休息以保持效率');
    });

    it('应该为短工时生成建议', () => {
      const recommendations = (analyticsService as any).generateRecommendations(
        80, 3, 3 // 正常效率，短工时，正常高峰时段
      );

      expect(recommendations).toContain('可以考虑增加每日工作时间以提高产出');
    });

    it('应该为少高峰时段生成建议', () => {
      const recommendations = (analyticsService as any).generateRecommendations(
        80, 8, 1 // 正常效率，正常工时，少高峰时段
      );

      expect(recommendations).toContain('尝试找到更多高效工作时段，合理安排重要任务');
    });

    it('表现良好时应该给出鼓励', () => {
      const recommendations = (analyticsService as any).generateRecommendations(
        90, 8, 3 // 高效率，正常工时，正常高峰时段
      );

      expect(recommendations).toContain('保持当前的工作节奏，效率表现良好！');
    });
  });

  describe('getTimeRange', () => {
    it('应该正确计算日期范围', () => {
      const result = (analyticsService as any).getTimeRange('week');
      
      expect(result).toHaveProperty('start');
      expect(result).toHaveProperty('end');
      expect(new Date(result.start)).toBeInstanceOf(Date);
      expect(new Date(result.end)).toBeInstanceOf(Date);
    });

    it('应该处理自定义日期范围', () => {
      const startDate = '2025-08-01T00:00:00Z';
      const endDate = '2025-08-31T23:59:59Z';
      
      const result = (analyticsService as any).getTimeRange('custom', startDate, endDate);
      
      expect(result.start).toBe('2025-08-01T00:00:00.000Z');
      expect(result.end).toBe('2025-08-31T23:59:59.000Z');
    });

    it('应该为不同时间范围返回正确的时间跨度', () => {
      const dayResult = (analyticsService as any).getTimeRange('day');
      const weekResult = (analyticsService as any).getTimeRange('week');
      const monthResult = (analyticsService as any).getTimeRange('month');
      
      const daySpan = new Date(dayResult.end).getTime() - new Date(dayResult.start).getTime();
      const weekSpan = new Date(weekResult.end).getTime() - new Date(weekResult.start).getTime();
      const monthSpan = new Date(monthResult.end).getTime() - new Date(monthResult.start).getTime();
      
      expect(daySpan).toBeLessThan(weekSpan);
      expect(weekSpan).toBeLessThan(monthSpan);
    });
  });
});