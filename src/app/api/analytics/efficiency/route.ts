import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // 模拟效率分析数据
    const efficiencyData = {
      overallEfficiency: 78.5, // 百分比
      monthlyTrend: [
        { month: '1月', efficiency: 72.3 },
        { month: '2月', efficiency: 75.8 },
        { month: '3月', efficiency: 78.5 },
        { month: '4月', efficiency: 81.2 }
      ],
      taskCompletionRate: {
        onTime: 68.4,
        delayed: 23.1,
        ahead: 8.5
      },
      productivityHeatmap: [
        { day: 0, hour: 9, value: 0.7 },
        { day: 0, hour: 10, value: 0.9 },
        { day: 0, hour: 11, value: 0.8 },
        { day: 0, hour: 14, value: 0.6 },
        { day: 0, hour: 15, value: 0.8 },
        { day: 1, hour: 9, value: 0.8 },
        { day: 1, hour: 10, value: 0.95 },
        { day: 1, hour: 11, value: 0.9 },
        { day: 1, hour: 14, value: 0.7 },
        { day: 1, hour: 15, value: 0.85 }
      ],
      focusTimeDistribution: {
        deepWork: { hours: 156.5, percentage: 45.2 },
        meetings: { hours: 89.2, percentage: 25.8 },
        communication: { hours: 67.8, percentage: 19.6 },
        breaks: { hours: 32.5, percentage: 9.4 }
      },
      bottlenecks: [
        { category: '等待审核', impact: 'high', frequency: 15 },
        { category: '依赖阻塞', impact: 'medium', frequency: 8 },
        { category: '工具问题', impact: 'low', frequency: 12 }
      ],
      recommendations: [
        '建议在上午10-11点安排重要任务，此时效率最高',
        '减少会议时间，当前占比过高影响深度工作',
        '优化审核流程，减少等待时间'
      ]
    };

    return NextResponse.json({
      success: true,
      data: efficiencyData
    });
  } catch (error) {
    console.error('获取效率分析数据失败:', error);
    return NextResponse.json(
      { success: false, message: '获取效率分析数据失败' },
      { status: 500 }
    );
  }
}