import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // 模拟报告模板数据
    const templates = [
      {
        id: 'weekly-summary',
        name: '周报模板',
        description: '标准周报格式，包含任务完成情况和时间统计',
        category: 'summary',
        fields: ['tasks', 'timeSpent', 'achievements', 'nextWeekPlan'],
        isDefault: true,
        createdAt: '2024-01-01T00:00:00Z'
      },
      {
        id: 'project-status',
        name: '项目状态报告',
        description: '项目进度和里程碑跟踪报告',
        category: 'project',
        fields: ['projectOverview', 'milestones', 'risks', 'resources'],
        isDefault: true,
        createdAt: '2024-01-01T00:00:00Z'
      },
      {
        id: 'time-analysis',
        name: '时间分析报告',
        description: '详细的时间分配和效率分析报告',
        category: 'analytics',
        fields: ['timeDistribution', 'efficiency', 'trends', 'recommendations'],
        isDefault: false,
        createdAt: '2024-01-01T00:00:00Z'
      },
      {
        id: 'monthly-review',
        name: '月度回顾',
        description: '月度工作总结和绩效分析',
        category: 'summary',
        fields: ['monthlyGoals', 'achievements', 'challenges', 'learnings'],
        isDefault: false,
        createdAt: '2024-01-01T00:00:00Z'
      }
    ];

    return NextResponse.json({
      success: true,
      data: { templates }
    });
  } catch (error) {
    console.error('获取报告模板失败:', error);
    return NextResponse.json(
      { success: false, message: '获取报告模板失败' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, category, fields } = body;

    // 模拟创建新模板
    const newTemplate = {
      id: `template_${Date.now()}`,
      name,
      description,
      category,
      fields,
      isDefault: false,
      createdAt: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      data: { template: newTemplate }
    });
  } catch (error) {
    console.error('创建报告模板失败:', error);
    return NextResponse.json(
      { success: false, message: '创建报告模板失败' },
      { status: 500 }
    );
  }
}