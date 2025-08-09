import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // 模拟报告历史数据
    const reports = [
      {
        id: 'report_001',
        name: '周报 - 2024年第1周',
        type: 'weekly-summary',
        status: 'completed',
        generatedAt: '2024-01-07T10:30:00Z',
        downloadUrl: '/api/reports/download/report_001',
        size: '2.3 MB',
        format: 'pdf'
      },
      {
        id: 'report_002',
        name: 'Nobody Logger项目状态',
        type: 'project-status',
        status: 'completed',
        generatedAt: '2024-01-05T15:45:00Z',
        downloadUrl: '/api/reports/download/report_002',
        size: '1.8 MB',
        format: 'pdf'
      },
      {
        id: 'report_003',
        name: '时间分析报告 - 12月',
        type: 'time-analysis',
        status: 'completed',
        generatedAt: '2024-01-01T09:00:00Z',
        downloadUrl: '/api/reports/download/report_003',
        size: '3.1 MB',
        format: 'pdf'
      },
      {
        id: 'report_004',
        name: '2023年度工作总结',
        type: 'monthly-review',
        status: 'processing',
        generatedAt: '2023-12-31T16:20:00Z',
        downloadUrl: null,
        size: null,
        format: 'pdf'
      },
      {
        id: 'report_005',
        name: '开发效率分析',
        type: 'time-analysis',
        status: 'failed',
        generatedAt: '2023-12-28T11:15:00Z',
        downloadUrl: null,
        size: null,
        format: 'excel',
        error: '数据源连接超时'
      }
    ];

    return NextResponse.json({
      success: true,
      data: { reports }
    });
  } catch (error) {
    console.error('获取报告历史失败:', error);
    return NextResponse.json(
      { success: false, message: '获取报告历史失败' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reportId = searchParams.get('id');

    if (!reportId) {
      return NextResponse.json(
        { success: false, message: '报告ID不能为空' },
        { status: 400 }
      );
    }

    // 模拟删除报告
    return NextResponse.json({
      success: true,
      message: '报告已成功删除'
    });
  } catch (error) {
    console.error('删除报告失败:', error);
    return NextResponse.json(
      { success: false, message: '删除报告失败' },
      { status: 500 }
    );
  }
}