import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, dateRange, projectId, format } = body;

    // 模拟报告生成
    const reportId = `report_${Date.now()}`;
    const reportData = {
      id: reportId,
      type,
      dateRange,
      projectId,
      format,
      status: 'completed',
      generatedAt: new Date().toISOString(),
      downloadUrl: `/api/reports/download/${reportId}`,
      summary: {
        totalTasks: 45,
        completedTasks: 38,
        totalHours: 156.5,
        averageDaily: 7.8,
        completionRate: 84.4
      },
      sections: [
        {
          title: '项目概览',
          data: {
            projectName: 'Nobody Logger',
            startDate: dateRange?.start || '2024-01-01',
            endDate: dateRange?.end || '2024-01-31',
            status: 'Active'
          }
        },
        {
          title: '任务统计',
          data: {
            byStatus: {
              completed: 38,
              inProgress: 5,
              pending: 2
            },
            byPriority: {
              high: 12,
              medium: 23,
              low: 10
            }
          }
        },
        {
          title: '时间分析',
          data: {
            dailyAverage: 7.8,
            peakHours: '10:00-12:00',
            mostProductiveDay: '周二'
          }
        }
      ]
    };

    return NextResponse.json({
      success: true,
      data: reportData
    });
  } catch (error) {
    console.error('生成报告失败:', error);
    return NextResponse.json(
      { success: false, message: '生成报告失败' },
      { status: 500 }
    );
  }
}