import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Modal, 
  Form, 
  Input, 
  Select, 
  Tag, 
  Space, 
  message,
  Popconfirm,
  Typography,
  Row,
  Col
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  CopyOutlined,
  EyeOutlined,
  DownloadOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface ReportTemplate {
  id: number;
  name: string;
  description: string;
  category: string;
  isSystem: boolean;
  usageCount: number;
  createdAt: string;
  templateConfig: {
    sections: any[];
    format: 'pdf' | 'excel' | 'html';
    pageSize: 'A4' | 'A3' | 'Letter';
    orientation: 'portrait' | 'landscape';
  };
}

export const ReportTemplateManager: React.FC = () => {
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ReportTemplate | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      // TODO: 实现真实的API调用
      // const response = await fetch('/api/report-templates');
      // const result = await response.json();
      
      // 模拟数据
      const mockTemplates: ReportTemplate[] = [
        {
          id: 1,
          name: '项目进度报告',
          description: '包含甘特图、里程碑和任务完成情况的综合报告',
          category: 'project',
          isSystem: true,
          usageCount: 45,
          createdAt: '2025-08-01T09:00:00Z',
          templateConfig: {
            sections: ['overview', 'gantt', 'tasks', 'milestones'],
            format: 'pdf',
            pageSize: 'A4',
            orientation: 'landscape'
          }
        },
        {
          id: 2,
          name: '时间分析报告',
          description: '工作时间分布、效率分析和改进建议',
          category: 'time',
          isSystem: true,
          usageCount: 32,
          createdAt: '2025-08-02T10:00:00Z',
          templateConfig: {
            sections: ['time_distribution', 'efficiency', 'recommendations'],
            format: 'pdf',
            pageSize: 'A4',
            orientation: 'portrait'
          }
        },
        {
          id: 3,
          name: '团队协作报告',
          description: '团队成员贡献度、任务分配和协作效率',
          category: 'team',
          isSystem: false,
          usageCount: 18,
          createdAt: '2025-08-03T14:30:00Z',
          templateConfig: {
            sections: ['team_overview', 'member_contributions', 'task_assignments'],
            format: 'excel',
            pageSize: 'A4',
            orientation: 'portrait'
          }
        }
      ];
      
      setTemplates(mockTemplates);
    } catch (error) {
      console.error('加载报告模板失败:', error);
      message.error('加载报告模板失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = () => {
    setEditingTemplate(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEditTemplate = (template: ReportTemplate) => {
    setEditingTemplate(template);
    form.setFieldsValue({
      name: template.name,
      description: template.description,
      category: template.category,
      format: template.templateConfig.format,
      pageSize: template.templateConfig.pageSize,
      orientation: template.templateConfig.orientation
    });
    setIsModalVisible(true);
  };

  const handleSaveTemplate = async (values: any) => {
    try {
      if (editingTemplate) {
        // TODO: 更新模板API
        message.success('模板更新成功');
      } else {
        // TODO: 创建模板API
        message.success('模板创建成功');
      }
      
      setIsModalVisible(false);
      loadTemplates();
    } catch (error) {
      message.error('保存模板失败');
    }
  };

  const handleCopyTemplate = async (template: ReportTemplate) => {
    try {
      // TODO: 复制模板API
      message.success(`已复制模板 "${template.name}"`);
      loadTemplates();
    } catch (error) {
      message.error('复制模板失败');
    }
  };

  const handleDeleteTemplate = async (template: ReportTemplate) => {
    try {
      // TODO: 删除模板API
      message.success('模板删除成功');
      loadTemplates();
    } catch (error) {
      message.error('删除模板失败');
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      project: '项目',
      time: '时间',
      team: '团队',
      custom: '自定义'
    };
    return labels[category] || category;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      project: 'blue',
      time: 'green',
      team: 'purple',
      custom: 'orange'
    };
    return colors[category] || 'default';
  };

  const columns = [
    {
      title: '模板名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: ReportTemplate) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{text}</div>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.description}
          </Text>
        </div>
      )
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: (category: string) => (
        <Tag color={getCategoryColor(category)}>
          {getCategoryLabel(category)}
        </Tag>
      )
    },
    {
      title: '格式',
      dataIndex: 'templateConfig',
      key: 'format',
      width: 80,
      render: (config: any) => (
        <Tag color="default">
          {config.format.toUpperCase()}
        </Tag>
      )
    },
    {
      title: '类型',
      dataIndex: 'isSystem',
      key: 'isSystem',
      width: 80,
      render: (isSystem: boolean) => (
        <Tag color={isSystem ? 'gold' : 'default'}>
          {isSystem ? '系统' : '自定义'}
        </Tag>
      )
    },
    {
      title: '使用次数',
      dataIndex: 'usageCount',
      key: 'usageCount',
      width: 100,
      align: 'center' as const,
      sorter: (a: ReportTemplate, b: ReportTemplate) => a.usageCount - b.usageCount
    },
    {
      title: '操作',
      key: 'actions',
      width: 180,
      render: (_, record: ReportTemplate) => (
        <Space size="small">
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleEditTemplate(record)}
          >
            查看
          </Button>
          
          <Button
            type="text"
            size="small"
            icon={<CopyOutlined />}
            onClick={() => handleCopyTemplate(record)}
          >
            复制
          </Button>
          
          {!record.isSystem && (
            <>
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleEditTemplate(record)}
              >
                编辑
              </Button>
              
              <Popconfirm
                title="确定要删除这个模板吗？"
                onConfirm={() => handleDeleteTemplate(record)}
                okText="确定"
                cancelText="取消"
              >
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                >
                  删除
                </Button>
              </Popconfirm>
            </>
          )}
        </Space>
      )
    }
  ];

  return (
    <div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '16px'
      }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>
            报告模板管理
          </Title>
          <Text type="secondary">
            创建和管理报告模板，快速生成标准化报告
          </Text>
        </div>
        
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleCreateTemplate}
        >
          新建模板
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={templates}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `显示 ${range[0]}-${range[1]} 条，共 ${total} 条`
          }}
        />
      </Card>

      <Modal
        title={editingTemplate ? '编辑模板' : '新建模板'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={600}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveTemplate}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="模板名称"
                name="name"
                rules={[{ required: true, message: '请输入模板名称' }]}
              >
                <Input placeholder="请输入模板名称" />
              </Form.Item>
            </Col>
            
            <Col span={12}>
              <Form.Item
                label="分类"
                name="category"
                rules={[{ required: true, message: '请选择分类' }]}
              >
                <Select placeholder="选择分类">
                  <Option value="project">项目报告</Option>
                  <Option value="time">时间分析</Option>
                  <Option value="team">团队协作</Option>
                  <Option value="custom">自定义</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="描述"
            name="description"
          >
            <TextArea 
              rows={3} 
              placeholder="请输入模板描述" 
              showCount 
              maxLength={200}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="输出格式"
                name="format"
                rules={[{ required: true, message: '请选择格式' }]}
              >
                <Select placeholder="选择格式">
                  <Option value="pdf">PDF</Option>
                  <Option value="excel">Excel</Option>
                  <Option value="html">HTML</Option>
                </Select>
              </Form.Item>
            </Col>
            
            <Col span={8}>
              <Form.Item
                label="页面大小"
                name="pageSize"
                rules={[{ required: true, message: '请选择页面大小' }]}
              >
                <Select placeholder="选择页面大小">
                  <Option value="A4">A4</Option>
                  <Option value="A3">A3</Option>
                  <Option value="Letter">Letter</Option>
                </Select>
              </Form.Item>
            </Col>
            
            <Col span={8}>
              <Form.Item
                label="页面方向"
                name="orientation"
                rules={[{ required: true, message: '请选择页面方向' }]}
              >
                <Select placeholder="选择方向">
                  <Option value="portrait">竖向</Option>
                  <Option value="landscape">横向</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <div style={{ 
            display: 'flex', 
            justifyContent: 'flex-end', 
            gap: '8px',
            marginTop: '24px'
          }}>
            <Button onClick={() => setIsModalVisible(false)}>
              取消
            </Button>
            <Button type="primary" htmlType="submit">
              {editingTemplate ? '更新' : '创建'}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};