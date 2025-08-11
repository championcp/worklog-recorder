import React, { useState } from 'react';
import { 
  Modal, 
  Form, 
  Input, 
  Select, 
  Button, 
  Space, 
  Tag, 
  message, 
  Typography,
  Alert,
  Divider
} from 'antd';
import { 
  UserAddOutlined, 
  MailOutlined, 
  DeleteOutlined,
  PlusOutlined 
} from '@ant-design/icons';

const { TextArea } = Input;
const { Option } = Select;
const { Text } = Typography;

interface InviteMemberModalProps {
  visible: boolean;
  projectId: number;
  projectName: string;
  onCancel: () => void;
  onSuccess: (result: any) => void;
}

interface EmailItem {
  id: string;
  email: string;
  role: 'editor' | 'viewer';
}

export const InviteMemberModal: React.FC<InviteMemberModalProps> = ({
  visible,
  projectId,
  projectName,
  onCancel,
  onSuccess
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [emailList, setEmailList] = useState<EmailItem[]>([]);
  const [currentEmail, setCurrentEmail] = useState('');
  const [currentRole, setCurrentRole] = useState<'editor' | 'viewer'>('viewer');

  const handleAddEmail = () => {
    if (!currentEmail) return;
    
    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(currentEmail)) {
      message.error('请输入有效的邮箱地址');
      return;
    }

    // 检查是否已存在
    if (emailList.some(item => item.email === currentEmail)) {
      message.error('该邮箱已在列表中');
      return;
    }

    const newItem: EmailItem = {
      id: Date.now().toString(),
      email: currentEmail,
      role: currentRole
    };

    setEmailList([...emailList, newItem]);
    setCurrentEmail('');
  };

  const handleRemoveEmail = (id: string) => {
    setEmailList(emailList.filter(item => item.id !== id));
  };

  const handleRoleChange = (id: string, role: 'editor' | 'viewer') => {
    setEmailList(emailList.map(item => 
      item.id === id ? { ...item, role } : item
    ));
  };

  const handleSubmit = async () => {
    if (emailList.length === 0) {
      message.error('请至少添加一个邮箱地址');
      return;
    }

    try {
      setLoading(true);
      
      const values = await form.validateFields();
      
      const request = {
        projectId,
        invitations: emailList.map(item => ({
          email: item.email,
          role: item.role
        })),
        message: values.message,
        expiresIn: values.expiresIn || 168 // 默认7天
      };

      // TODO: 实现真实的API调用
      // const response = await fetch(`/api/projects/${projectId}/members/invite`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(request)
      // });
      
      // 模拟API响应
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockResult = {
        invitations: emailList.map(item => ({
          email: item.email,
          status: 'sent',
          invitationId: Math.floor(Math.random() * 10000),
          token: `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        })),
        summary: {
          total: emailList.length,
          sent: emailList.length,
          failed: 0,
          alreadyMembers: 0
        }
      };

      message.success(`成功发送 ${mockResult.summary.sent} 个邀请`);
      onSuccess(mockResult);
      
      // 重置表单
      form.resetFields();
      setEmailList([]);
      setCurrentEmail('');
      
    } catch (error) {
      console.error('发送邀请失败:', error);
      message.error('发送邀请失败');
    } finally {
      setLoading(false);
    }
  };

  const getRoleLabel = (role: string) => {
    return role === 'editor' ? '编辑者' : '查看者';
  };

  const getRoleColor = (role: string) => {
    return role === 'editor' ? 'blue' : 'green';
  };

  const getRoleDescription = (role: string) => {
    if (role === 'editor') {
      return '可以查看、编辑项目内容，创建和修改任务';
    }
    return '只能查看项目内容，无法进行编辑操作';
  };

  return (
    <Modal
      title={
        <div>
          <UserAddOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
          邀请团队成员
        </div>
      }
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={600}
      destroyOnClose
    >
      <div style={{ marginBottom: '16px' }}>
        <Alert
          message={
            <div>
              邀请成员加入项目 <Text strong>"{projectName}"</Text>
            </div>
          }
          type="info"
          showIcon
          style={{ marginBottom: '16px' }}
        />
      </div>

      {/* 添加邮箱区域 */}
      <div style={{ 
        border: '1px solid #d9d9d9',
        borderRadius: '6px',
        padding: '16px',
        marginBottom: '16px',
        backgroundColor: '#fafafa'
      }}>
        <div style={{ marginBottom: '12px' }}>
          <Text strong>添加邀请邮箱</Text>
        </div>
        
        <Space.Compact style={{ width: '100%', marginBottom: '12px' }}>
          <Input
            placeholder="输入邮箱地址"
            value={currentEmail}
            onChange={(e) => setCurrentEmail(e.target.value)}
            onPressEnter={handleAddEmail}
            prefix={<MailOutlined />}
            style={{ flex: 1 }}
          />
          <Select
            value={currentRole}
            onChange={setCurrentRole}
            style={{ width: 120 }}
          >
            <Option value="viewer">查看者</Option>
            <Option value="editor">编辑者</Option>
          </Select>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={handleAddEmail}
          >
            添加
          </Button>
        </Space.Compact>
        
        <Text type="secondary" style={{ fontSize: '12px' }}>
          {getRoleDescription(currentRole)}
        </Text>
      </div>

      {/* 邮箱列表 */}
      {emailList.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ marginBottom: '8px' }}>
            <Text strong>邀请列表 ({emailList.length})</Text>
          </div>
          
          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {emailList.map(item => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 12px',
                  border: '1px solid #f0f0f0',
                  borderRadius: '4px',
                  marginBottom: '8px',
                  backgroundColor: '#fff'
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold' }}>{item.email}</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {getRoleDescription(item.role)}
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Select
                    value={item.role}
                    onChange={(role) => handleRoleChange(item.id, role)}
                   
                    style={{ width: 100 }}
                  >
                    <Option value="viewer">查看者</Option>
                    <Option value="editor">编辑者</Option>
                  </Select>
                  
                  <Button
                    type="text"
                   
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleRemoveEmail(item.id)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Divider />

      {/* 表单区域 */}
      <Form
        form={form}
        layout="vertical"
      >
        <Form.Item
          label="邀请消息"
          name="message"
          help="可选：为受邀者添加个性化消息"
        >
          <TextArea
            rows={3}
            placeholder="欢迎加入我们的项目..."
            showCount
            maxLength={200}
          />
        </Form.Item>

        <Form.Item
          label="邀请有效期"
          name="expiresIn"
          initialValue={168}
          help="邀请链接的有效时间（小时）"
        >
          <Select>
            <Option value={24}>24小时</Option>
            <Option value={72}>3天</Option>
            <Option value={168}>7天</Option>
            <Option value={336}>14天</Option>
          </Select>
        </Form.Item>
      </Form>

      {/* 权限说明 */}
      <Alert
        message="权限说明"
        description={
          <div style={{ fontSize: '12px', marginTop: '8px' }}>
            <div><strong>编辑者：</strong>可以查看、编辑项目，创建和修改任务，记录工作时间</div>
            <div><strong>查看者：</strong>只能查看项目内容和报告，无法进行编辑操作</div>
            <div style={{ marginTop: '4px', color: '#999' }}>
              项目所有者可以随时修改成员权限或移除成员
            </div>
          </div>
        }
        type="info"
        style={{ marginTop: '16px' }}
      />

      {/* 按钮区域 */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'flex-end', 
        gap: '8px',
        marginTop: '24px',
        paddingTop: '16px',
        borderTop: '1px solid #f0f0f0'
      }}>
        <Button onClick={onCancel}>
          取消
        </Button>
        <Button 
          type="primary" 
          onClick={handleSubmit}
          loading={loading}
          disabled={emailList.length === 0}
        >
          发送邀请 ({emailList.length})
        </Button>
      </div>
    </Modal>
  );
};