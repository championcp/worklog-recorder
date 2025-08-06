import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Avatar, 
  Tag, 
  Space, 
  Typography, 
  Modal, 
  Select,
  message,
  Tooltip,
  Popconfirm,
  Badge,
  Row,
  Col,
  Statistic
} from 'antd';
import { 
  UserAddOutlined, 
  SettingOutlined, 
  DeleteOutlined,
  MailOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  UserOutlined,
  CrownOutlined
} from '@ant-design/icons';
import { InviteMemberModal } from './InviteMemberModal';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

interface TeamMember {
  id: number;
  userId: number;
  username: string;
  email: string;
  avatar?: string;
  role: 'owner' | 'editor' | 'viewer';
  joinedAt: string;
  lastActiveAt?: string;
  isOnline: boolean;
  tasksCount: number;
  hoursLogged: number;
}

interface Invitation {
  id: number;
  email: string;
  role: string;
  status: 'pending' | 'expired';
  invitedBy: string;
  createdAt: string;
  expiresAt: string;
}

interface TeamManagementProps {
  projectId: number;
  projectName: string;
  userRole: 'owner' | 'editor' | 'viewer';
}

export const TeamManagement: React.FC<TeamManagementProps> = ({
  projectId,
  projectName,
  userRole
}) => {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(false);
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [roleChangeModalVisible, setRoleChangeModalVisible] = useState(false);

  useEffect(() => {
    loadTeamData();
  }, [projectId]);

  const loadTeamData = async () => {
    try {
      setLoading(true);
      
      // TODO: 实现真实的API调用
      // const response = await fetch(`/api/projects/${projectId}/members`);
      // const result = await response.json();
      
      // 模拟数据
      const mockMembers: TeamMember[] = [
        {
          id: 1,
          userId: 1,
          username: '张三',
          email: 'zhangsan@example.com',
          avatar: undefined,
          role: 'owner',
          joinedAt: '2025-07-15T10:00:00Z',
          lastActiveAt: '2025-08-06T14:30:00Z',
          isOnline: true,
          tasksCount: 15,
          hoursLogged: 45.5
        },
        {
          id: 2,
          userId: 2,
          username: '李四',
          email: 'lisi@example.com',
          avatar: undefined,
          role: 'editor',
          joinedAt: '2025-07-20T09:30:00Z',
          lastActiveAt: '2025-08-06T11:45:00Z',
          isOnline: false,
          tasksCount: 12,
          hoursLogged: 38.2
        },
        {
          id: 3,
          userId: 3,
          username: '王五',
          email: 'wangwu@example.com',
          avatar: undefined,
          role: 'viewer',
          joinedAt: '2025-08-01T14:15:00Z',
          lastActiveAt: '2025-08-05T16:20:00Z',
          isOnline: false,
          tasksCount: 0,
          hoursLogged: 0
        }
      ];

      const mockInvitations: Invitation[] = [
        {
          id: 1,
          email: 'newmember@example.com',
          role: 'editor',
          status: 'pending',
          invitedBy: '张三',
          createdAt: '2025-08-06T09:00:00Z',
          expiresAt: '2025-08-13T09:00:00Z'
        },
        {
          id: 2,
          email: 'expired@example.com',
          role: 'viewer',
          status: 'expired',
          invitedBy: '张三',
          createdAt: '2025-07-25T10:00:00Z',
          expiresAt: '2025-08-01T10:00:00Z'
        }
      ];

      setMembers(mockMembers);
      setInvitations(mockInvitations);
    } catch (error) {
      console.error('加载团队数据失败:', error);
      message.error('加载团队数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteSuccess = (result: any) => {
    message.success(`成功发送 ${result.summary.sent} 个邀请`);
    setInviteModalVisible(false);
    loadTeamData(); // 重新加载数据
  };

  const handleChangeRole = (member: TeamMember) => {
    setEditingMember(member);
    setRoleChangeModalVisible(true);
  };

  const handleRoleChange = async (newRole: 'editor' | 'viewer') => {
    if (!editingMember) return;

    try {
      // TODO: 实现真实的API调用
      // await fetch(`/api/projects/${projectId}/members/${editingMember.id}/role`, {
      //   method: 'PUT',
      //   body: JSON.stringify({ role: newRole })
      // });

      // 模拟成功
      setMembers(prev => prev.map(m => 
        m.id === editingMember.id ? { ...m, role: newRole } : m
      ));

      message.success(`已将 ${editingMember.username} 的角色更改为 ${getRoleLabel(newRole)}`);
      setRoleChangeModalVisible(false);
      setEditingMember(null);
    } catch (error) {
      message.error('角色更改失败');
    }
  };

  const handleRemoveMember = async (member: TeamMember) => {
    try {
      // TODO: 实现真实的API调用
      // await fetch(`/api/projects/${projectId}/members/${member.id}`, {
      //   method: 'DELETE'
      // });

      // 模拟成功
      setMembers(prev => prev.filter(m => m.id !== member.id));
      message.success(`已移除成员 ${member.username}`);
    } catch (error) {
      message.error('移除成员失败');
    }
  };

  const handleResendInvitation = async (invitation: Invitation) => {
    try {
      // TODO: 实现重新发送邀请API
      message.success(`已重新发送邀请给 ${invitation.email}`);
      loadTeamData();
    } catch (error) {
      message.error('重新发送邀请失败');
    }
  };

  const handleCancelInvitation = async (invitation: Invitation) => {
    try {
      // TODO: 实现取消邀请API
      setInvitations(prev => prev.filter(i => i.id !== invitation.id));
      message.success('邀请已取消');
    } catch (error) {
      message.error('取消邀请失败');
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      owner: '所有者',
      editor: '编辑者',
      viewer: '查看者'
    };
    return labels[role] || role;
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      owner: 'gold',
      editor: 'blue',
      viewer: 'green'
    };
    return colors[role] || 'default';
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <CrownOutlined />;
      case 'editor':
        return <SettingOutlined />;
      case 'viewer':
        return <UserOutlined />;
      default:
        return null;
    }
  };

  const canManageMembers = userRole === 'owner' || userRole === 'editor';

  const memberColumns = [
    {
      title: '成员信息',
      key: 'member',
      render: (_, record: TeamMember) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Badge dot={record.isOnline} color="green" offset={[-4, 4]}>
            <Avatar 
              src={record.avatar} 
              size="large"
              style={{ backgroundColor: '#1890ff' }}
            >
              {record.username.charAt(0)}
            </Avatar>
          </Badge>
          
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
              {record.username}
            </div>
            <div style={{ color: '#666', fontSize: '12px' }}>
              {record.email}
            </div>
            <div style={{ color: '#999', fontSize: '11px' }}>
              {record.isOnline ? '在线' : 
                record.lastActiveAt ? 
                `最后活跃: ${dayjs(record.lastActiveAt).format('MM-DD HH:mm')}` : 
                '从未活跃'
              }
            </div>
          </div>
        </div>
      )
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 120,
      render: (role: string) => (
        <Tag color={getRoleColor(role)} icon={getRoleIcon(role)}>
          {getRoleLabel(role)}
        </Tag>
      )
    },
    {
      title: '贡献统计',
      key: 'contribution',
      width: 150,
      render: (_, record: TeamMember) => (
        <div style={{ fontSize: '12px' }}>
          <div>任务: {record.tasksCount} 个</div>
          <div>工时: {record.hoursLogged} 小时</div>
        </div>
      )
    },
    {
      title: '加入时间',
      dataIndex: 'joinedAt',
      key: 'joinedAt',
      width: 120,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD')
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      render: (_, record: TeamMember) => {
        if (record.role === 'owner') {
          return <Tag color="gold">项目所有者</Tag>;
        }

        if (!canManageMembers) {
          return '-';
        }

        return (
          <Space size="small">
            <Tooltip title="更改角色">
              <Button
                type="text"
                size="small"
                icon={<SettingOutlined />}
                onClick={() => handleChangeRole(record)}
              />
            </Tooltip>
            
            <Popconfirm
              title={`确定要移除成员 "${record.username}" 吗？`}
              description="移除后该成员将无法访问项目，已分配的任务需要重新指派。"
              onConfirm={() => handleRemoveMember(record)}
              okText="确定"
              cancelText="取消"
            >
              <Tooltip title="移除成员">
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                />
              </Tooltip>
            </Popconfirm>
          </Space>
        );
      }
    }
  ];

  const invitationColumns = [
    {
      title: '邮箱地址',
      dataIndex: 'email',
      key: 'email'
    },
    {
      title: '邀请角色',
      dataIndex: 'role',
      key: 'role',
      width: 100,
      render: (role: string) => (
        <Tag color={getRoleColor(role)}>{getRoleLabel(role)}</Tag>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const config = status === 'pending' 
          ? { color: 'processing', icon: <ClockCircleOutlined />, text: '待接受' }
          : { color: 'error', icon: <ExclamationCircleOutlined />, text: '已过期' };
        
        return (
          <Tag color={config.color} icon={config.icon}>
            {config.text}
          </Tag>
        );
      }
    },
    {
      title: '邀请者',
      dataIndex: 'invitedBy',
      key: 'invitedBy',
      width: 100
    },
    {
      title: '过期时间',
      dataIndex: 'expiresAt',
      key: 'expiresAt',
      width: 120,
      render: (date: string) => dayjs(date).format('MM-DD HH:mm')
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      render: (_, record: Invitation) => {
        if (!canManageMembers) return '-';
        
        return (
          <Space size="small">
            {record.status === 'expired' && (
              <Tooltip title="重新发送">
                <Button
                  type="text"
                  size="small"
                  icon={<MailOutlined />}
                  onClick={() => handleResendInvitation(record)}
                />
              </Tooltip>
            )}
            
            <Tooltip title="取消邀请">
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleCancelInvitation(record)}
              />
            </Tooltip>
          </Space>
        );
      }
    }
  ];

  // 统计数据
  const stats = {
    totalMembers: members.length,
    onlineMembers: members.filter(m => m.isOnline).length,
    pendingInvitations: invitations.filter(i => i.status === 'pending').length,
    totalTasks: members.reduce((sum, m) => sum + m.tasksCount, 0)
  };

  return (
    <div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>
            团队管理
          </Title>
          <Text type="secondary">
            管理项目 "{projectName}" 的团队成员
          </Text>
        </div>
        
        {canManageMembers && (
          <Button
            type="primary"
            icon={<UserAddOutlined />}
            onClick={() => setInviteModalVisible(true)}
          >
            邀请成员
          </Button>
        )}
      </div>

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="团队成员"
              value={stats.totalMembers}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="在线成员"
              value={stats.onlineMembers}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="待处理邀请"
              value={stats.pendingInvitations}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="总任务数"
              value={stats.totalTasks}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 成员列表 */}
      <Card 
        title="团队成员" 
        style={{ marginBottom: '24px' }}
      >
        <Table
          columns={memberColumns}
          dataSource={members}
          rowKey="id"
          loading={loading}
          pagination={false}
        />
      </Card>

      {/* 邀请列表 */}
      {(invitations.length > 0 || canManageMembers) && (
        <Card title="邀请记录">
          <Table
            columns={invitationColumns}
            dataSource={invitations}
            rowKey="id"
            loading={loading}
            pagination={false}
            locale={{
              emptyText: '暂无邀请记录'
            }}
          />
        </Card>
      )}

      {/* 邀请成员弹窗 */}
      <InviteMemberModal
        visible={inviteModalVisible}
        projectId={projectId}
        projectName={projectName}
        onCancel={() => setInviteModalVisible(false)}
        onSuccess={handleInviteSuccess}
      />

      {/* 角色更改弹窗 */}
      <Modal
        title="更改成员角色"
        open={roleChangeModalVisible}
        onCancel={() => setRoleChangeModalVisible(false)}
        footer={null}
        width={400}
      >
        {editingMember && (
          <div>
            <div style={{ marginBottom: '16px', textAlign: 'center' }}>
              <Avatar 
                size={64} 
                src={editingMember.avatar}
                style={{ backgroundColor: '#1890ff' }}
              >
                {editingMember.username.charAt(0)}
              </Avatar>
              <div style={{ marginTop: '8px', fontSize: '16px', fontWeight: 'bold' }}>
                {editingMember.username}
              </div>
              <div style={{ color: '#666', fontSize: '14px' }}>
                当前角色: {getRoleLabel(editingMember.role)}
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <Text strong>选择新角色:</Text>
            </div>

            <Space direction="vertical" style={{ width: '100%' }}>
              <Button
                type={editingMember.role === 'editor' ? 'primary' : 'default'}
                size="large"
                block
                icon={<SettingOutlined />}
                onClick={() => handleRoleChange('editor')}
                disabled={editingMember.role === 'editor'}
              >
                <div style={{ textAlign: 'left' }}>
                  <div>编辑者</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    可以查看、编辑项目，创建和修改任务
                  </div>
                </div>
              </Button>

              <Button
                type={editingMember.role === 'viewer' ? 'primary' : 'default'}
                size="large"
                block
                icon={<UserOutlined />}
                onClick={() => handleRoleChange('viewer')}
                disabled={editingMember.role === 'viewer'}
              >
                <div style={{ textAlign: 'left' }}>
                  <div>查看者</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    只能查看项目内容，无法进行编辑
                  </div>
                </div>
              </Button>
            </Space>
          </div>
        )}
      </Modal>
    </div>
  );
};