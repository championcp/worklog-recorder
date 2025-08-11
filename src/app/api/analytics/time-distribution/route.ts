import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // 模拟时间分布分析数据
    const timeDistributionData = {
      dailyData: [
        { date: '2024-01-01', totalHours: 8.5, productivity: 85 },
        { date: '2024-01-02', totalHours: 7.2, productivity: 78 },
        { date: '2024-01-03', totalHours: 9.1, productivity: 92 },
        { date: '2024-01-04', totalHours: 6.8, productivity: 74 },
        { date: '2024-01-05', totalHours: 8.0, productivity: 88 },
        { date: '2024-01-06', totalHours: 5.5, productivity: 82 },
        { date: '2024-01-07', totalHours: 3.2, productivity: 65 }
      ],
      hourlyDistribution: [
        { hour: '09:00', minutes: 45 },
        { hour: '10:00', minutes: 60 },
        { hour: '11:00', minutes: 55 },
        { hour: '12:00', minutes: 30 },
        { hour: '13:00', minutes: 20 },
        { hour: '14:00', minutes: 50 },
        { hour: '15:00', minutes: 60 },
        { hour: '16:00', minutes: 45 },
        { hour: '17:00', minutes: 35 }
      ],
      weeklyTrend: [
        { week: '第1周', hours: 42.5 },
        { week: '第2周', hours: 38.2 },
        { week: '第3周', hours: 45.8 },
        { week: '第4周', hours: 41.3 }
      ],
      categoryTime: [
        { category: '开发任务', hours: 125.5, percentage: 45.2 },
        { category: '测试调试', hours: 68.3, percentage: 24.6 },
        { category: '文档编写', hours: 42.7, percentage: 15.4 },
        { category: '会议沟通', hours: 28.9, percentage: 10.4 },
        { category: '学习研究', hours: 12.1, percentage: 4.4 }
      ]
    };

    return NextResponse.json({
      success: true,
      data: timeDistributionData
    });
  } catch (error) {
    console.error('获取时间分布数据失败:', error);
    return NextResponse.json(
      { success: false, message: '获取时间分布数据失败' },
      { status: 500 }
    );
  }
}