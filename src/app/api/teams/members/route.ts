import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    // 模拟团队成员数据
    const members = [
      {
        id: 1,
        username: 'admin',
        email: 'admin@example.com',
        role: 'owner',
        joinedAt: '2024-01-01T00:00:00Z',
        lastActiveAt: '2024-01-07T14:30:00Z',
        avatar: '/avatars/admin.png',
        status: 'active'
      },
      {
        id: 2,
        username: 'jane_smith',
        email: 'jane.smith@example.com',
        role: 'editor',
        joinedAt: '2024-01-06T09:20:00Z',
        lastActiveAt: '2024-01-07T11:15:00Z',
        avatar: '/avatars/jane.png',
        status: 'active'
      },
      {
        id: 3,
        username: 'developer1',
        email: 'dev1@example.com',
        role: 'editor',
        joinedAt: '2024-01-03T16:45:00Z',
        lastActiveAt: '2024-01-06T18:22:00Z',
        avatar: '/avatars/dev1.png',
        status: 'active'
      },
      {
        id: 4,
        username: 'viewer_user',
        email: 'viewer@example.com',
        role: 'viewer',
        joinedAt: '2024-01-02T10:30:00Z',
        lastActiveAt: '2024-01-05T09:45:00Z',
        avatar: '/avatars/viewer.png',
        status: 'inactive'
      }
    ];

    return NextResponse.json({
      success: true,
      data: { members }
    });
  } catch (error) {
    console.error('获取团队成员失败:', error);
    return NextResponse.json(
      { success: false, message: '获取团队成员失败' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { memberId, role } = body;

    // 验证输入
    if (!memberId || !role) {
      return NextResponse.json(
        { success: false, message: '成员ID和角色不能为空' },
        { status: 400 }
      );
    }

    // 验证角色
    if (!['owner', 'editor', 'viewer'].includes(role)) {
      return NextResponse.json(
        { success: false, message: '无效的角色类型' },
        { status: 400 }
      );
    }

    // 模拟更新成员角色
    return NextResponse.json({
      success: true,
      message: '成员角色已更新'
    });
  } catch (error) {
    console.error('更新成员角色失败:', error);
    return NextResponse.json(
      { success: false, message: '更新成员角色失败' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('memberId');

    if (!memberId) {
      return NextResponse.json(
        { success: false, message: '成员ID不能为空' },
        { status: 400 }
      );
    }

    // 模拟移除成员
    return NextResponse.json({
      success: true,
      message: '成员已从团队中移除'
    });
  } catch (error) {
    console.error('移除团队成员失败:', error);
    return NextResponse.json(
      { success: false, message: '移除成员失败' },
      { status: 500 }
    );
  }
}