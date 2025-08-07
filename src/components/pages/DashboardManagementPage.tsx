import React, { useState, useEffect } from 'react';
import { 
  Button, 
  Card, 
  Col, 
  Row, 
  Typography, 
  Space, 
  Tag, 
  Modal, 
  message,
  Dropdown,
  Empty,
  Spin
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  CopyOutlined,
  StarOutlined,
  StarFilled,
  EllipsisOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { DashboardBuilder } from '@/components/analytics/DashboardBuilder';
import { DashboardLayout } from '@/types/analytics';

const { Title, Text } = Typography;

interface DashboardInfo {
  id: number;
  name: string;
  description: string;
  isDefault: boolean;
  isShared: boolean;
  createdAt: string;
  updatedAt: string;
  widgetCount: number;
  layout?: DashboardLayout;
}

const DashboardManagementPage: React.FC = () => {
  const [dashboards, setDashboards] = useState<DashboardInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDashboard, setSelectedDashboard] = useState<DashboardInfo | null>(null);
  const [isBuilderVisible, setIsBuilderVisible] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadDashboards();
  }, []);

  // 加载仪表板列表
  const loadDashboards = async () => {
    try {
      setLoading(true);
      // TODO: 实现实际的API调用
      // const response = await fetch('/api/dashboards');
      // const result = await response.json();
      
      // 模拟数据
      const mockDashboards: DashboardInfo[] = [
        {
          id: 1,
          name: '我的工作台',
          description: '个人工作概览和进度跟踪',
          isDefault: true,
          isShared: false,
          createdAt: '2025-08-01T09:00:00Z',
          updatedAt: '2025-08-06T14:30:00Z',
          widgetCount: 6
        },
        {
          id: 2,
          name: '项目管理中心',
          description: '所有项目的进度和状态监控',
          isDefault: false,
          isShared: true,
          createdAt: '2025-07-28T10:15:00Z',
          updatedAt: '2025-08-05T16:45:00Z',
          widgetCount: 4
        },
        {
          id: 3,
          name: '时间分析面板',
          description: '工作时间分布和效率分析',
          isDefault: false,
          isShared: false,
          createdAt: '2025-07-25T11:20:00Z',
          updatedAt: '2025-08-04T09:15:00Z',
          widgetCount: 8
        }
      ];
      
      setDashboards(mockDashboards);
    } catch (error) {
      console.error('加载仪表板失败:', error);
      message.error('加载仪表板失败');
    } finally {
      setLoading(false);
    }
  };

  // 创建新仪表板
  const handleCreateDashboard = () => {
    setSelectedDashboard(null);
    setIsCreating(true);
    setIsBuilderVisible(true);
  };

  // 编辑仪表板
  const handleEditDashboard = (dashboard: DashboardInfo) => {
    setSelectedDashboard(dashboard);
    setIsCreating(false);
    setIsBuilderVisible(true);
  };

  // 复制仪表板
  const handleCopyDashboard = async (dashboard: DashboardInfo) => {
    try {
      // TODO: 实现复制API
      message.success(`已复制仪表板 "${dashboard.name}"`);
      loadDashboards();
    } catch (error) {
      message.error('复制仪表板失败');
    }
  };

  // 删除仪表板
  const handleDeleteDashboard = (dashboard: DashboardInfo) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除仪表板 "${dashboard.name}" 吗？此操作不可撤销。`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          // TODO: 实现删除API
          message.success('仪表板已删除');
          loadDashboards();
        } catch (error) {
          message.error('删除仪表板失败');
        }
      }
    });
  };

  // 设置默认仪表板
  const handleSetDefault = async (dashboard: DashboardInfo) => {
    try {
      // TODO: 实现设置默认API
      message.success(`已将 "${dashboard.name}" 设置为默认仪表板`);
      loadDashboards();
    } catch (error) {
      message.error('设置默认仪表板失败');
    }
  };

  // 保存仪表板
  const handleSaveDashboard = async (layout: DashboardLayout, name: string) => {
    try {
      if (isCreating) {
        // TODO: 创建新仪表板API
        message.success('仪表板创建成功');
      } else {
        // TODO: 更新仪表板API
        message.success('仪表板更新成功');
      }
      
      setIsBuilderVisible(false);
      loadDashboards();
    } catch (error) {
      throw error;
    }
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // 获取操作菜单
  const getActionMenu = (dashboard: DashboardInfo) => ({
    items: [
      {
        key: 'edit',
        icon: <EditOutlined />,
        label: '编辑',
        onClick: () => handleEditDashboard(dashboard)
      },
      {
        key: 'copy',
        icon: <CopyOutlined />,
        label: '复制',
        onClick: () => handleCopyDashboard(dashboard)
      },
      {
        key: 'default',
        icon: dashboard.isDefault ? <StarFilled /> : <StarOutlined />,
        label: dashboard.isDefault ? '取消默认' : '设为默认',
        onClick: () => handleSetDefault(dashboard),
        disabled: dashboard.isDefault
      },
      {
        type: 'divider' as const
      },
      {
        key: 'delete',
        icon: <DeleteOutlined />,
        label: '删除',
        danger: true,
        onClick: () => handleDeleteDashboard(dashboard),
        disabled: dashboard.isDefault
      }
    ]
  });

  if (isBuilderVisible) {
    return (
      <DashboardBuilder
        initialLayout={selectedDashboard?.layout}
        dashboardName={selectedDashboard?.name}
        isEditable={true}
        onSave={handleSaveDashboard}
        onPreview={() => setIsBuilderVisible(false)}
      />
    );
  }

  return (
    <div className="dashboard-management" style={{ padding: '24px' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>
            仪表板管理
          </Title>
          <Text type="secondary">
            创建和管理您的个性化仪表板
          </Text>
        </div>
        
        <Button
          type="primary"
          size="large"
          icon={<PlusOutlined />}
          onClick={handleCreateDashboard}
        >
          创建仪表板
        </Button>
      </div>

      <Spin spinning={loading}>
        {dashboards.length === 0 ? (
          <Empty
            description={
              <div>
                <div>还没有任何仪表板</div>
                <Text type="secondary">创建您的第一个仪表板来开始数据分析之旅</Text>
              </div>
            }
            style={{ marginTop: '80px' }}
          >
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateDashboard}>
              创建仪表板
            </Button>
          </Empty>
        ) : (
          <Row gutter={[24, 24]}>
            {dashboards.map(dashboard => (
              <Col key={dashboard.id} xs={24} sm={12} lg={8} xl={6}>
                <Card
                  hoverable
                  style={{ height: '100%' }}
                  actions={[
                    <Button 
                      key="view"
                      type="text" 
                      icon={<EyeOutlined />}
                      onClick={() => handleEditDashboard(dashboard)}
                    >
                      查看
                    </Button>,
                    <Dropdown 
                      key="more"
                      menu={getActionMenu(dashboard)}
                      trigger={['click']}
                    >
                      <Button type="text" icon={<EllipsisOutlined />} />
                    </Dropdown>
                  ]}
                >
                  <div>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '12px'
                    }}>
                      <Title level={4} style={{ margin: 0, flex: 1 }}>
                        {dashboard.name}
                      </Title>
                      
                      <Space>
                        {dashboard.isDefault && (
                          <Tag color="gold" icon={<StarFilled />}>
                            默认
                          </Tag>
                        )}
                        {dashboard.isShared && (
                          <Tag color="blue">
                            共享
                          </Tag>
                        )}
                      </Space>
                    </div>
                    
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {dashboard.description || '暂无描述'}
                    </Text>
                    
                    <div style={{ 
                      marginTop: '16px',
                      padding: '12px 0',
                      borderTop: '1px solid #f0f0f0',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <Text type="secondary" style={{ fontSize: '11px' }}>
                        {dashboard.widgetCount} 个小部件
                      </Text>
                      
                      <Text type="secondary" style={{ fontSize: '11px' }}>
                        更新于 {formatDate(dashboard.updatedAt)}
                      </Text>
                    </div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Spin>
    </div>
  );
};

export default DashboardManagementPage;