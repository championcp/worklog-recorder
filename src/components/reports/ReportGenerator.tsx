import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Form, 
  Select, 
  DatePicker, 
  Button, 
  Steps, 
  Typography, 
  Row, 
  Col,
  Checkbox,
  Input,
  message,
  Progress,
  Alert,
  Space,
  Divider
} from 'antd';
import { 
  FileTextOutlined, 
  DownloadOutlined, 
  SettingOutlined,
  CheckCircleOutlined,
  LoadingOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { TextArea } = Input;
const { Option } = Select;
const { Step } = Steps;

interface ReportTemplate {
  id: number;
  name: string;
  description: string;
  category: string;
}

interface Project {
  id: number;
  name: string;
}

interface GenerateReportRequest {
  templateId?: number;
  type: 'pdf' | 'excel' | 'html';
  config: {
    title: string;
    timeRange: {
      start: string;
      end: string;
    };
    projectIds: number[];
    sections: string[];
    customSections?: any[];
  };
  deliveryMethod?: 'download' | 'email';
  emailRecipients?: string[];
}

interface ReportTask {
  taskId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  downloadUrl?: string;
  fileSize?: number;
  errorMessage?: string;
  estimatedTime?: number;
}

export const ReportGenerator: React.FC = () => {
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [generatingTask, setGeneratingTask] = useState<ReportTask | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTemplates();
    loadProjects();
  }, []);

  // 监听报告生成进度
  useEffect(() => {
    if (generatingTask && generatingTask.status === 'processing') {
      const interval = setInterval(checkTaskProgress, 2000);
      return () => clearInterval(interval);
    }
  }, [generatingTask]);

  const loadTemplates = async () => {
    try {
      // 模拟数据
      const mockTemplates: ReportTemplate[] = [
        {
          id: 1,
          name: '项目进度报告',
          description: '包含甘特图、里程碑和任务完成情况',
          category: 'project'
        },
        {
          id: 2,
          name: '时间分析报告',
          description: '工作时间分布和效率分析',
          category: 'time'
        },
        {
          id: 3,
          name: '团队协作报告',
          description: '团队成员贡献度和协作效率',
          category: 'team'
        }
      ];
      setTemplates(mockTemplates);
    } catch (error) {
      console.error('加载模板失败:', error);
    }
  };

  const loadProjects = async () => {
    try {
      // 模拟数据
      const mockProjects: Project[] = [
        { id: 1, name: '网站重构项目' },
        { id: 2, name: '移动应用开发' },
        { id: 3, name: '数据分析系统' }
      ];
      setProjects(mockProjects);
    } catch (error) {
      console.error('加载项目失败:', error);
    }
  };

  const checkTaskProgress = async () => {
    if (!generatingTask) return;

    try {
      // TODO: 实现真实的API调用
      // const response = await fetch(`/api/reports/tasks/${generatingTask.taskId}`);
      // const result = await response.json();
      
      // 模拟进度更新
      const progress = Math.min(generatingTask.progress + Math.random() * 20, 100);
      
      if (progress >= 100) {
        setGeneratingTask({
          ...generatingTask,
          status: 'completed',
          progress: 100,
          downloadUrl: '/api/reports/download/mock-report.pdf',
          fileSize: 1024 * 1024 * 2.5 // 2.5MB
        });
        message.success('报告生成成功');
      } else {
        setGeneratingTask({
          ...generatingTask,
          progress
        });
      }
    } catch (error) {
      console.error('检查任务进度失败:', error);
      setGeneratingTask({
        ...generatingTask,
        status: 'failed',
        errorMessage: '生成失败，请重试'
      });
    }
  };

  const handleNext = () => {
    setCurrentStep(currentStep + 1);
  };

  const handlePrev = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleTemplateSelect = (templateId: number) => {
    const template = templates.find(t => t.id === templateId);
    setSelectedTemplate(template || null);
    
    // 预填充表单数据
    form.setFieldsValue({
      templateId,
      title: `${template?.name} - ${dayjs().format('YYYY年MM月DD日')}`
    });
  };

  const handleGenerateReport = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const request: GenerateReportRequest = {
        templateId: values.templateId,
        type: values.format || 'pdf',
        config: {
          title: values.title,
          timeRange: {
            start: values.timeRange[0].toISOString(),
            end: values.timeRange[1].toISOString()
          },
          projectIds: values.projects || [],
          sections: values.sections || []
        },
        deliveryMethod: values.deliveryMethod || 'download',
        ...(values.deliveryMethod === 'email' && {
          emailRecipients: values.emailRecipients?.split(',').map((email: string) => email.trim())
        })
      };

      // TODO: 实现真实的API调用
      // const response = await fetch('/api/reports/generate', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(request)
      // });
      
      // 模拟任务创建
      const mockTask: ReportTask = {
        taskId: `task_${Date.now()}`,
        status: 'processing',
        progress: 0,
        estimatedTime: 30 // 30秒
      };

      setGeneratingTask(mockTask);
      setCurrentStep(3);
      message.success('报告生成任务已启动');
      
    } catch (error) {
      console.error('生成报告失败:', error);
      message.error('生成报告失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (generatingTask?.downloadUrl) {
      const link = document.createElement('a');
      link.href = generatingTask.downloadUrl;
      link.download = `report_${generatingTask.taskId}.pdf`;
      link.click();
      message.success('下载已开始');
    }
  };

  const handleReset = () => {
    setCurrentStep(0);
    setSelectedTemplate(null);
    setGeneratingTask(null);
    form.resetFields();
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div>
            <Title level={4}>选择报告模板</Title>
            <Row gutter={16}>
              {templates.map(template => (
                <Col key={template.id} xs={24} md={8}>
                  <Card
                    hoverable
                    className={selectedTemplate?.id === template.id ? 'selected' : ''}
                    onClick={() => handleTemplateSelect(template.id)}
                    style={{
                      marginBottom: '16px',
                      border: selectedTemplate?.id === template.id ? 
                        '2px solid #1890ff' : '1px solid #d9d9d9'
                    }}
                  >
                    <div style={{ textAlign: 'center', padding: '16px 0' }}>
                      <FileTextOutlined 
                        style={{ 
                          fontSize: '48px', 
                          color: '#1890ff',
                          marginBottom: '12px'
                        }} 
                      />
                      <Title level={5} style={{ margin: '0 0 8px 0' }}>
                        {template.name}
                      </Title>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {template.description}
                      </Text>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        );

      case 1:
        return (
          <div>
            <Title level={4}>配置报告参数</Title>
            <Form form={form} layout="vertical">
              <Row gutter={16}>
                <Col span={24}>
                  <Form.Item
                    label="报告标题"
                    name="title"
                    rules={[{ required: true, message: '请输入报告标题' }]}
                  >
                    <Input placeholder="请输入报告标题" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="时间范围"
                    name="timeRange"
                    rules={[{ required: true, message: '请选择时间范围' }]}
                  >
                    <RangePicker 
                      style={{ width: '100%' }}
                      defaultValue={[dayjs().subtract(1, 'month'), dayjs()]}
                    />
                  </Form.Item>
                </Col>
                
                <Col span={12}>
                  <Form.Item
                    label="包含项目"
                    name="projects"
                  >
                    <Select
                      mode="multiple"
                      placeholder="选择项目（空则包含全部）"
                      allowClear
                    >
                      {projects.map(project => (
                        <Option key={project.id} value={project.id}>
                          {project.name}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="输出格式"
                    name="format"
                    initialValue="pdf"
                  >
                    <Select>
                      <Option value="pdf">PDF</Option>
                      <Option value="excel">Excel</Option>
                      <Option value="html">HTML</Option>
                    </Select>
                  </Form.Item>
                </Col>
                
                <Col span={12}>
                  <Form.Item
                    label="交付方式"
                    name="deliveryMethod"
                    initialValue="download"
                  >
                    <Select onChange={(value) => {
                      // 当选择邮件发送时，显示收件人字段
                    }}>
                      <Option value="download">下载</Option>
                      <Option value="email">邮件发送</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                label="包含章节"
                name="sections"
                initialValue={['overview', 'charts', 'data']}
              >
                <Checkbox.Group>
                  <Row>
                    <Col span={8}>
                      <Checkbox value="overview">概览摘要</Checkbox>
                    </Col>
                    <Col span={8}>
                      <Checkbox value="charts">图表分析</Checkbox>
                    </Col>
                    <Col span={8}>
                      <Checkbox value="data">详细数据</Checkbox>
                    </Col>
                    <Col span={8}>
                      <Checkbox value="recommendations">改进建议</Checkbox>
                    </Col>
                    <Col span={8}>
                      <Checkbox value="appendix">附录</Checkbox>
                    </Col>
                  </Row>
                </Checkbox.Group>
              </Form.Item>

              <Form.Item
                noStyle
                shouldUpdate={(prev, current) => prev.deliveryMethod !== current.deliveryMethod}
              >
                {({ getFieldValue }) => 
                  getFieldValue('deliveryMethod') === 'email' ? (
                    <Form.Item
                      label="收件人邮箱"
                      name="emailRecipients"
                      rules={[{ required: true, message: '请输入收件人邮箱' }]}
                    >
                      <Input placeholder="多个邮箱用逗号分隔" />
                    </Form.Item>
                  ) : null
                }
              </Form.Item>
            </Form>
          </div>
        );

      case 2:
        return (
          <div>
            <Title level={4}>确认报告配置</Title>
            <Card>
              <div style={{ marginBottom: '16px' }}>
                <Text strong>报告模板：</Text>
                <Text>{selectedTemplate?.name}</Text>
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <Text strong>报告标题：</Text>
                <Text>{form.getFieldValue('title')}</Text>
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <Text strong>时间范围：</Text>
                <Text>
                  {form.getFieldValue('timeRange')?.[0]?.format('YYYY-MM-DD')} 至{' '}
                  {form.getFieldValue('timeRange')?.[1]?.format('YYYY-MM-DD')}
                </Text>
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <Text strong>输出格式：</Text>
                <Text>{form.getFieldValue('format')?.toUpperCase()}</Text>
              </div>
              
              <div>
                <Text strong>交付方式：</Text>
                <Text>
                  {form.getFieldValue('deliveryMethod') === 'email' ? '邮件发送' : '下载'}
                </Text>
              </div>
            </Card>
          </div>
        );

      case 3:
        return (
          <div>
            <Title level={4}>报告生成中</Title>
            {generatingTask && (
              <Card>
                {generatingTask.status === 'processing' && (
                  <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <LoadingOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: '16px' }} />
                    <div style={{ marginBottom: '16px' }}>
                      <Title level={4}>正在生成报告...</Title>
                      <Text type="secondary">预计需要 {generatingTask.estimatedTime} 秒</Text>
                    </div>
                    <Progress 
                      percent={Math.round(generatingTask.progress)} 
                      strokeColor="#1890ff"
                      style={{ maxWidth: '400px' }}
                    />
                  </div>
                )}

                {generatingTask.status === 'completed' && (
                  <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <CheckCircleOutlined style={{ fontSize: '48px', color: '#52c41a', marginBottom: '16px' }} />
                    <div style={{ marginBottom: '24px' }}>
                      <Title level={4}>报告生成成功！</Title>
                      <Text type="secondary">
                        文件大小：{((generatingTask.fileSize || 0) / 1024 / 1024).toFixed(1)}MB
                      </Text>
                    </div>
                    <Button
                      type="primary"
                      size="large"
                      icon={<DownloadOutlined />}
                      onClick={handleDownload}
                    >
                      下载报告
                    </Button>
                  </div>
                )}

                {generatingTask.status === 'failed' && (
                  <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <Alert
                      message="报告生成失败"
                      description={generatingTask.errorMessage}
                      type="error"
                      showIcon
                      style={{ marginBottom: '24px' }}
                    />
                    <Button onClick={handleReset}>
                      重新开始
                    </Button>
                  </div>
                )}
              </Card>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <Title level={3}>报告生成</Title>
        <Text type="secondary">
          选择模板并配置参数，快速生成专业的项目报告
        </Text>
      </div>

      <Card>
        <Steps current={currentStep} style={{ marginBottom: '32px' }}>
          <Step title="选择模板" icon={<FileTextOutlined />} />
          <Step title="配置参数" icon={<SettingOutlined />} />
          <Step title="确认配置" icon={<CheckCircleOutlined />} />
          <Step title="生成报告" icon={<DownloadOutlined />} />
        </Steps>

        <div style={{ minHeight: '400px' }}>
          {renderStepContent()}
        </div>

        <Divider />

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>
            {currentStep === 3 && generatingTask?.status === 'completed' && (
              <Button onClick={handleReset}>
                生成新报告
              </Button>
            )}
          </div>
          
          <Space>
            {currentStep > 0 && currentStep < 3 && (
              <Button onClick={handlePrev}>
                上一步
              </Button>
            )}
            
            {currentStep < 2 && (
              <Button 
                type="primary" 
                onClick={handleNext}
                disabled={currentStep === 0 && !selectedTemplate}
              >
                下一步
              </Button>
            )}
            
            {currentStep === 2 && (
              <Button 
                type="primary" 
                onClick={handleGenerateReport}
                loading={loading}
              >
                生成报告
              </Button>
            )}
          </Space>
        </div>
      </Card>
    </div>
  );
};