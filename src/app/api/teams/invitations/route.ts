import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    // 模拟团队邀请数据
    const invitations = [
      {
        id: 'inv_001',
        email: 'john.doe@example.com',
        role: 'editor',
        status: 'pending',
        invitedAt: '2024-01-07T10:30:00Z',
        expiresAt: '2024-01-14T10:30:00Z',
        invitedBy: {
          id: 1,
          username: 'admin',
          email: 'admin@example.com'
        }
      },
      {
        id: 'inv_002',
        email: 'jane.smith@example.com',
        role: 'viewer',
        status: 'accepted',
        invitedAt: '2024-01-05T15:45:00Z',
        acceptedAt: '2024-01-06T09:20:00Z',
        invitedBy: {
          id: 1,
          username: 'admin',
          email: 'admin@example.com'
        }
      },
      {
        id: 'inv_003',
        email: 'bob.wilson@example.com',
        role: 'editor',
        status: 'expired',
        invitedAt: '2023-12-28T11:15:00Z',
        expiresAt: '2024-01-04T11:15:00Z',
        invitedBy: {
          id: 1,
          username: 'admin',
          email: 'admin@example.com'
        }
      }
    ];

    return NextResponse.json({
      success: true,
      data: { invitations }
    });
  } catch (error) {
    console.error('获取团队邀请失败:', error);
    return NextResponse.json(
      { success: false, message: '获取团队邀请失败' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, role, projectId } = body;

    // 验证输入
    if (!email || !role || !projectId) {
      return NextResponse.json(
        { success: false, message: '邮箱、角色和项目ID不能为空' },
        { status: 400 }
      );
    }

    // 模拟发送邀请
    const invitation = {
      id: `inv_${Date.now()}`,
      email,
      role,
      status: 'pending',
      invitedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7天后过期
      invitedBy: {
        id: 1,
        username: 'admin',
        email: 'admin@example.com'
      }
    };

    return NextResponse.json({
      success: true,
      message: '邀请已发送',
      data: { invitation }
    });
  } catch (error) {
    console.error('发送团队邀请失败:', error);
    return NextResponse.json(
      { success: false, message: '发送邀请失败' },
      { status: 500 }
    );
  }
}