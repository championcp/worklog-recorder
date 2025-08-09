import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // 模拟仪表板分析数据
    const dashboardData = {
      totalTasks: 156,
      completedTasks: 98,
      totalTimeSpent: 24.5, // 小时
      averageTaskTime: 0.9, // 小时
      activeProjects: 12,
      completionRate: 62.8, // 百分比
      weeklyTimeData: [
        { day: '周一', hours: 8.2 },
        { day: '周二', hours: 7.5 },
        { day: '周三', hours: 6.8 },
        { day: '周四', hours: 8.1 },
        { day: '周五', hours: 7.9 },
        { day: '周六', hours: 4.2 },
        { day: '周日', hours: 2.8 }
      ],
      taskDistribution: [
        { category: '开发', count: 45, percentage: 28.8 },
        { category: '测试', count: 32, percentage: 20.5 },
        { category: '文档', count: 28, percentage: 17.9 },
        { category: '会议', count: 24, percentage: 15.4 },
        { category: '其他', count: 27, percentage: 17.3 }
      ],
      recentActivity: [
        { id: 1, type: 'task_completed', message: '完成任务: API接口开发', timestamp: new Date().toISOString() },
        { id: 2, type: 'time_logged', message: '记录时间: 2.5小时', timestamp: new Date(Date.now() - 3600000).toISOString() },
        { id: 3, type: 'project_updated', message: '更新项目: Nobody Logger', timestamp: new Date(Date.now() - 7200000).toISOString() }
      ]
    };

    return NextResponse.json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    console.error('获取仪表板数据失败:', error);
    return NextResponse.json(
      { success: false, message: '获取仪表板数据失败' },
      { status: 500 }
    );
  }
}