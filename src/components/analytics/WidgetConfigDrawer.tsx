import React, { useState, useEffect } from 'react';
import { 
  Form, 
  Input, 
  InputNumber, 
  Select, 
  Switch, 
  Button, 
  Space, 
  Divider,
  Card,
  Typography,
  ColorPicker,
  Tabs,
  Alert
} from 'antd';
import { SaveOutlined, RedoOutlined } from '@ant-design/icons';
import { DashboardItem, WidgetConfig } from '@/types/analytics';

const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;
const { TabPane } = Tabs;

interface WidgetConfigDrawerProps {
  widget: DashboardItem;
  onSave: (config: Partial<WidgetConfig>) => void;
  onCancel: () => void;
}

export const WidgetConfigDrawer: React.FC<WidgetConfigDrawerProps> = ({
  widget,
  onSave,
  onCancel
}) => {
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState('basic');

  useEffect(() => {
    // 初始化表单数据
    form.setFieldsValue({
      title: widget.config.title,
      refresh: widget.config.refresh || 300,
      ...widget.config.filters,
      ...widget.config.settings
    });
  }, [widget, form]);

  const handleSave = () => {
    form.validateFields().then(values => {
      const { title, refresh, ...otherValues } = values;
      
      const updatedConfig: Partial<WidgetConfig> = {
        title,
        refresh,
        filters: extractFilters(otherValues, widget.config.type),
        settings: extractSettings(otherValues, widget.config.type)
      };
      
      onSave(updatedConfig);
    });
  };

  const handleReset = () => {
    form.resetFields();
  };

  // 根据小部件类型提取筛选条件
  const extractFilters = (values: any, widgetType: string): Record<string, any> => {
    const filters: Record<string, any> = {};
    
    switch (widgetType) {
      case 'overview':
      case 'project_progress':
      case 'time_analysis':
        if (values.timeRange) filters.timeRange = values.timeRange;
        if (values.projectIds) filters.projectIds = values.projectIds;
        break;
        
      case 'activity_feed':
        if (values.activityTypes) filters.activityTypes = values.activityTypes;
        if (values.maxItems) filters.maxItems = values.maxItems;
        break;
        
      case 'task_summary':
        if (values.taskStatus) filters.taskStatus = values.taskStatus;
        if (values.assigneeId) filters.assigneeId = values.assigneeId;
        break;
    }
    
    return filters;
  };

  // 根据小部件类型提取设置
  const extractSettings = (values: any, widgetType: string): Record<string, any> => {
    const settings: Record<string, any> = {};
    
    switch (widgetType) {
      case 'time_heatmap':
        if (values.colorScheme) settings.colorScheme = values.colorScheme;
        if (values.showWeekends !== undefined) settings.showWeekends = values.showWeekends;
        break;
        
      case 'efficiency_chart':
        if (values.chartType) settings.chartType = values.chartType;
        if (values.showTrend !== undefined) settings.showTrend = values.showTrend;
        break;
        
      case 'project_progress':
        if (values.displayMode) settings.displayMode = values.displayMode;
        if (values.showRiskIndicators !== undefined) settings.showRiskIndicators = values.showRiskIndicators;
        break;
    }
    
    return settings;
  };

  // 渲染基础配置
  const renderBasicConfig = () => (
    <div>
      <Form.Item
        label="小部件标题"
        name="title"
        rules={[{ required: true, message: '请输入小部件标题' }]}
      >
        <Input placeholder="请输入标题" />
      </Form.Item>

      <Form.Item
        label="自动刷新间隔"
        name="refresh"
        help="设置为0表示不自动刷新（秒）"
      >
        <InputNumber
          min={0}
          max={3600}
          step={30}
          style={{ width: '100%' }}
          placeholder="300"
        />
      </Form.Item>
    </div>
  );

  // 渲染筛选配置
  const renderFilterConfig = () => {
    switch (widget.config.type) {
      case 'overview':
      case 'project_progress':
      case 'time_analysis':
        return (
          <div>
            <Form.Item
              label="时间范围"
              name="timeRange"
            >
              <Select placeholder="选择时间范围" allowClear>
                <Option value="day">今天</Option>
                <Option value="week">本周</Option>
                <Option value="month">本月</Option>
                <Option value="quarter">本季度</Option>
                <Option value="year">本年</Option>
              </Select>
            </Form.Item>

            <Form.Item
              label="项目筛选"
              name="projectIds"
              help="不选择表示包含所有项目"
            >
              <Select
                mode="multiple"
                placeholder="选择项目"
                allowClear
                // TODO: 从API获取项目列表
              >
                <Option value={1}>示例项目1</Option>
                <Option value={2}>示例项目2</Option>
              </Select>
            </Form.Item>
          </div>
        );

      case 'activity_feed':
        return (
          <div>
            <Form.Item
              label="活动类型"
              name="activityTypes"
            >
              <Select
                mode="multiple"
                placeholder="选择活动类型"
                allowClear
              >
                <Option value="task_created">任务创建</Option>
                <Option value="task_completed">任务完成</Option>
                <Option value="time_logged">时间记录</Option>
                <Option value="member_joined">成员加入</Option>
              </Select>
            </Form.Item>

            <Form.Item
              label="显示数量"
              name="maxItems"
            >
              <InputNumber
                min={5}
                max={50}
                style={{ width: '100%' }}
                placeholder="20"
              />
            </Form.Item>
          </div>
        );

      case 'task_summary':
        return (
          <div>
            <Form.Item
              label="任务状态"
              name="taskStatus"
            >
              <Select
                mode="multiple"
                placeholder="选择任务状态"
                allowClear
              >
                <Option value="pending">待开始</Option>
                <Option value="in_progress">进行中</Option>
                <Option value="completed">已完成</Option>
                <Option value="cancelled">已取消</Option>
              </Select>
            </Form.Item>

            <Form.Item
              label="负责人筛选"
              name="assigneeId"
            >
              <Select placeholder="选择负责人" allowClear>
                <Option value="me">我的任务</Option>
                {/* TODO: 从API获取团队成员列表 */}
              </Select>
            </Form.Item>
          </div>
        );

      default:
        return (
          <Alert
            message="该小部件暂不支持筛选配置"
            type="info"
            showIcon
          />
        );
    }
  };

  // 渲染外观配置
  const renderAppearanceConfig = () => {
    switch (widget.config.type) {
      case 'time_heatmap':
        return (
          <div>
            <Form.Item
              label="颜色方案"
              name="colorScheme"
            >
              <Select placeholder="选择颜色方案">
                <Option value="blue">蓝色系</Option>
                <Option value="green">绿色系</Option>
                <Option value="red">红色系</Option>
                <Option value="purple">紫色系</Option>
              </Select>
            </Form.Item>

            <Form.Item
              label="显示周末"
              name="showWeekends"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </div>
        );

      case 'efficiency_chart':
        return (
          <div>
            <Form.Item
              label="图表类型"
              name="chartType"
            >
              <Select placeholder="选择图表类型">
                <Option value="line">折线图</Option>
                <Option value="area">面积图</Option>
                <Option value="bar">柱状图</Option>
              </Select>
            </Form.Item>

            <Form.Item
              label="显示趋势线"
              name="showTrend"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </div>
        );

      case 'project_progress':
        return (
          <div>
            <Form.Item
              label="显示模式"
              name="displayMode"
            >
              <Select placeholder="选择显示模式">
                <Option value="list">列表模式</Option>
                <Option value="grid">网格模式</Option>
                <Option value="compact">紧凑模式</Option>
              </Select>
            </Form.Item>

            <Form.Item
              label="显示风险指标"
              name="showRiskIndicators"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </div>
        );

      default:
        return (
          <Alert
            message="该小部件暂不支持外观配置"
            type="info"
            showIcon
          />
        );
    }
  };

  return (
    <div className="widget-config-drawer">
      <div style={{ marginBottom: '16px' }}>
        <Title level={4} style={{ margin: 0 }}>
          配置 {widget.config.title}
        </Title>
        <Text type="secondary">
          类型: {widget.config.type}
        </Text>
      </div>

      <Form
        form={form}
        layout="vertical"
        scrollToFirstError
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="基础设置" key="basic">
            {renderBasicConfig()}
          </TabPane>
          
          <TabPane tab="数据筛选" key="filters">
            {renderFilterConfig()}
          </TabPane>
          
          <TabPane tab="外观设置" key="appearance">
            {renderAppearanceConfig()}
          </TabPane>
        </Tabs>
      </Form>

      <Divider />

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button icon={<RedoOutlined />} onClick={handleReset}>
          重置
        </Button>
        
        <Space>
          <Button onClick={onCancel}>
            取消
          </Button>
          <Button type="primary" icon={<SaveOutlined />} onClick={handleSave}>
            保存配置
          </Button>
        </Space>
      </div>
    </div>
  );
};